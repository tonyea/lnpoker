const db = require("../db");
const {
  kickLastPlayer,
  newRound,
  initNewRound,
  progress
} = require("./TableDealerService");
const {
  findTableByID,
  checkIfUserAllowed,
  isPlayerOnAnyTable,
  getPlayersAtTable,
  getMaxBet
} = require("./TableUtilityService");

/**
 * A function that returns all active games from the database
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed the list of active games as an object or error
 */
const all = async cb => {
  try {
    const { rows } = await db.query(
      `
      SELECT 
      tables.id AS id,
      minbuyin,
      status,
      maxplayers,
      count(player_id) as numplayers
      FROM tables
      INNER JOIN user_table 
    ON tables.id = user_table.table_id
    GROUP BY tables.id, minbuyin, status, maxplayers
    `
    );
    if (rows.length === 0) {
      return cb(null, []);
    }
    return cb(null, rows);
  } catch (e) {
    return cb({ unspecfiedDBError: "Could not get games" }, null);
  }
};

/**
 * Creates a new table / poker game
 * @param {number} userID ID of user creating the table
 * @param {number} buyin Minimum buyin to accept at game
 * @param {function} emitter Event emitter that can be called to emit events
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed the active game without the players array as an object or error
 */
const createNewTable = async (userID, buyin, emitter, cb) => {
  let tableID;
  try {
    if (await isPlayerOnAnyTable(userID)) {
      throw { alreadySeated: "Already playing at another table" };
    }

    await db
      .query(
        "INSERT INTO tables (minbuyin) VALUES ($1) returning id, smallblind, bigblind, minplayers, maxplayers, minbuyin, maxbuyin, pot, roundname, board, status ",
        [buyin]
      )
      .then(res => (tableID = res.rows[0].id));

    // auto join newly created table
    await joinTable(tableID, userID, emitter, cb);
  } catch (e) {
    if (e.alreadySeated) {
      return cb(e, null);
    }
    return cb({ unspecfiedDBError: "Could not create a table" }, null);
  }
};

/**
 * Seat player at a table that has already been created
 * @param {number} tableID ID of table being joined
 * @param {number} userID ID of user joining the table
 * @param {function} emitter Event emitter that can be called to emit events
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed the active game with the players array as an object or error
 */
const joinTable = async (tableID, userID, emitter, cb) => {
  let table;
  try {
    // if user is already seated at another table then he is redirected back to that table
    const tableIDwithPlayer = await isPlayerOnAnyTable(userID);
    if (tableIDwithPlayer) {
      // we're using tableIDwithPlayer (tableid) because it might be different from the one the user is trying to join. i.e. If the user tries to join a second table, he is returned to his first
      table = await findTableByID(tableIDwithPlayer);
      table.players = await getPlayersAtTable(tableIDwithPlayer, userID);
      return cb(null, table);
    }
    // if max users are already seated then throw error
    let minplayers, maxplayers, numplayers, bank;
    table = await findTableByID(tableID);
    minplayers = parseInt(table.minplayers);
    maxplayers = parseInt(table.maxplayers);

    await db
      .query(
        "SELECT count(id) as numplayers from user_table where table_id = $1",
        [tableID]
      )
      .then(res => {
        numplayers = res.rows.length > 0 ? parseInt(res.rows[0].numplayers) : 0;
      });
    if (numplayers === maxplayers) {
      throw { maxplayers: "Maximum players alread seated." };
    }

    // if bank < buy in then throw error
    await db
      .query("SELECT bank FROM users where id = $1", [userID])
      .then(res => {
        bank = res.rows.length > 0 ? parseInt(res.rows[0].bank) : 0;
      });
    if (bank < table.minbuyin) {
      throw { funds: "Insufficient funds." };
    }

    // force user to buy in to table amount
    await db.query("UPDATE users SET bank = bank - $2 WHERE id=$1", [
      userID,
      table.minbuyin
    ]);

    // append user id to table along with chips from bank, increment numplayers | auto join the table you create
    await db
      .query(
        "INSERT INTO user_table(player_id, table_id, chips) VALUES ($1, $2, $3)",
        [userID, tableID, table.minbuyin]
      )
      .then(() => numplayers++);

    //If there is no current game and we have enough players, start a new game. Set status to started
    // check if we have minimum number of players
    if (numplayers < minplayers) {
      table.players = await getPlayersAtTable(table.id, userID);

      // send socket emit to all users at table, except the user that joined, that a user has joined a table
      emitter
        .of("/game")
        .to(tableID)
        .emit("table updated");
      return cb(null, table);
    }

    // continuing, if we do have minplayers
    // start new round if status is 'waiting'
    let status;
    await db
      .query("SELECT status from tables where id = $1", [tableID])
      .then(res => {
        status = res.rows[0].status;
      });
    if (status === "waiting") {
      // First user at table is identified as dealer and everyone else is not a dealer by default. Will cycle dealer each round
      await db.query(
        "UPDATE user_table SET dealer = true WHERE table_id=$1 and id=(SELECT id FROM user_table WHERE table_id=$1 ORDER BY id LIMIT 1)",
        [tableID]
      );

      // start a new round
      await newRound(tableID);

      // set table status to started
      await db.query("UPDATE tables SET status = 'started' where id = $1", [
        tableID
      ]);

      // manual setting to avoid calling findtableByID again
      table.status = "started";
    }
    table.players = await getPlayersAtTable(tableID, userID);
    // send socket emit to all users at table, except the user that joined, that a user has joined a table
    emitter
      .of("/game")
      .to(tableID)
      .emit("table updated");
    return cb(null, table);
  } catch (e) {
    if (e.maxplayers || e.funds) {
      return cb(e, null);
    }
    return cb({ unspecifiedDBError: "Could not join table" }, null);
  }
};

/**
 * Get id of the table that the user has joined
 * @param {number} userID ID of user seeking info
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed the active game with the players array as an object or error
 */
const getTableId = async (userID, cb) => {
  try {
    const tableID = await isPlayerOnAnyTable(userID);
    return cb(null, tableID);
  } catch (e) {
    return cb(
      { unspecfiedDBError: "Could not search for user in tables" },
      null
    );
  }
};

/**
 * Get information on the table that the user has joined
 * @param {number} userID ID of user seeking info
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed the active game with the players array as an object or error
 */
const getTable = async (userID, emitter, cb) => {
  try {
    const alreadyAtTable = await isPlayerOnAnyTable(userID);

    if (!alreadyAtTable) {
      throw { userNotFound: "Not in an active game" };
    }

    table = await findTableByID(alreadyAtTable);
    table.players;
    getPlayersAtTable(alreadyAtTable, userID).then(async res => {
      table.players = res;
      // check if any user at table is timed out
      let isTimedOut = false;
      let timedOutPlayer = table.players.find(player => {
        const timestamp = player.action_timestamp;
        timestamp !== null
          ? (isTimedOut =
              new Date(timestamp).getTime() + table.timeout <= Date.now())
          : null;
        return isTimedOut;
      });

      if (isTimedOut) {
        let timedOutPlayerID;
        await db
          .query("SELECT id FROM users WHERE username=$1", [
            timedOutPlayer.username
          ])
          .then(res => {
            timedOutPlayerID = res.rows[0].id;
          });
        return await exitTable(timedOutPlayerID, emitter, cb);
      }
      return cb(null, table);
    });
  } catch (e) {
    if (e.userNotFound) {
      return cb(e, null);
    }
    return cb({ unspecfiedDBError: "Could not create a table" }, null);
  }
};

/**
 * Function to get user to exit the table. Funds distributed accordingly.
 * @param {number} userID ID of user leaving the table
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed errors or success message
 */
const exitTable = async (userID, emitter, cb) => {
  try {
    // throw any bets in pot
    let tableID;
    await db
      .query(
        "UPDATE tables SET pot = pot + (SELECT bet FROM user_table WHERE player_id = $1) WHERE id = (SELECT table_id FROM user_table WHERE player_id = $1) returning id",
        [userID]
      )
      .then(res => (tableID = res.rows[0].id));

    // return chips to bank
    await db.query(
      "UPDATE users SET bank = bank + (SELECT chips FROM user_table WHERE player_id = $1) WHERE id = $1",
      [userID]
    );

    const dbres = await db.query(
      `
      SELECT 
      player_id, seated, username
      FROM user_table
      INNER JOIN users on users.id=user_table.player_id
      WHERE table_id = ( SELECT table_id FROM user_table WHERE player_id = $1) AND player_id != $1`,
      [userID]
    );
    const remainingPlayers = dbres.rows;

    // remove user from table
    await db.query("DELETE FROM user_table WHERE player_id = $1", [userID]);

    // if number of players remaining, seated or unseated, is 1 then kick him out and then send message to user that he has been kicked out
    if (remainingPlayers.length === 1) {
      // first send message about gameover state
      emitter
        .of("/game")
        .in(tableID)
        .emit("round message", { gameover: true });
      // trigger exit game after 3 secs
      setTimeout(() => {
        emitter
          .of("/game")
          .in(tableID)
          .emit("gameover");
      }, 3000);
      return cb(null, {
        gameover: await kickLastPlayer(dbres.rows[0].player_id)
      });
    } else if (remainingPlayers.length === 0) {
      // deleting table if player 1 joins and leaves without getting other players
      await db.query("DELETE FROM tables WHERE id = $1", [tableID]);
    }
    // if only one player left seated, then return winner info
    const remainingSeatedPlayers = remainingPlayers.filter(
      player => player.seated
    );
    if (remainingSeatedPlayers.length === 1) {
      // give pot plus own bets to winner
      await db.query(
        "UPDATE user_table SET chips = chips + bet + (SELECT pot FROM tables WHERE id = (SELECT table_id FROM user_table WHERE player_id = $1)) WHERE player_id = $1",
        [remainingSeatedPlayers[0].player_id]
      );
      // init new round
      await initNewRound(remainingSeatedPlayers[0].player_id, emitter);
    }

    // if round is continuing, message everybody at table that db has been updated so they can see updated list of players
    emitter
      .of("/game")
      .in(tableID)
      .emit("table updated");
    return cb(null, "Success");
  } catch (e) {
    return cb({ unspecfiedDBError: "Could not exit table" }, null);
  }
};

/**
 * Player action check
 * @param {number} userID ID of user attempting the check
 * @param {function} emitter Event emitter that can be called to emit events
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed errors or success message
 */
const check = async (userID, emitter, cb) => {
  try {
    await checkIfUserAllowed(userID);

    // check that the person requesting the check is allowed to check
    // if any of the other players have made bets larger than you then you can't check
    const otherBetsRes = await db.query(
      `SELECT player_id, bet 
        FROM user_table 
        WHERE bet > (SELECT bet from user_table WHERE player_id = $1) AND table_id = (SELECT table_id from user_table WHERE player_id = $1) AND seated=true`,
      [userID]
    );
    if (otherBetsRes.rows.length > 0) {
      throw { notallowed: "Check not allowed, replay please" };
    }

    const res = await db.query(
      "UPDATE user_table SET talked=true, lastaction='check' where player_id = $1 returning * ",
      [userID]
    );
    if (res.rows.length > 0) {
      // if progress returns an object then return it to the callback
      return cb(null, await progress(userID, emitter));
    }
    errors.notupdated = "Did not update action and talked state";
    throw errors;
  } catch (e) {
    if (e.notallowed) {
      return cb(e, null);
    }
    return cb({ unspecfiedDBError: "Could not check" }, null);
  }
};

/**
 * Player action fold
 * @param {number} userID ID of user attempting the fold
 * @param {function} emitter Event emitter that can be called to emit events
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed errors or success message
 */
const fold = async (userID, emitter, cb) => {
  try {
    await checkIfUserAllowed(userID);

    // add my bet to the pot
    await db.query(
      "UPDATE tables SET pot=(SELECT bet from user_table WHERE player_id=$1) WHERE id = (SELECT table_id from user_table WHERE player_id = $1) returning * ",
      [userID]
    );
    //set my bet field to 0, set talked to true and last action to fold
    const res = await db.query(
      "UPDATE user_table SET talked=true, lastaction='fold', roundbet=(bet+roundbet), bet=0 where player_id = $1 returning * ",
      [userID]
    );
    if (res.rows.length > 0) {
      // if progress returns an object then return it to the callback
      return cb(null, await progress(userID, emitter));
    }
    throw { notupdated: "Did not update action and talked state" };

    //Attemp to progress the game
    // progress(this.table);
  } catch (e) {
    if (e.notupdated || e.notallowed || e.timedout) {
      return cb(e, null);
    }
    return cb({ unspecfiedDBError: "Could not fold" }, null);
  }
};

/**
 * Player action bet
 * @param {number} userID ID of user attempting the bet
 * @param {function} emitter Event emitter that can be called to emit events
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed errors or success message
 */
const bet = async (userID, betAmount, emitter, cb) => {
  try {
    await checkIfUserAllowed(userID);

    // see if I have sufficient number of chips. show error if I don't
    const res = await db.query(
      "SELECT chips FROM user_table WHERE player_id = $1",
      [userID]
    );
    const totalChips = res.rows[0].chips;

    if (totalChips <= betAmount) {
      return await allin(userID, emitter, cb);
    }

    // add chips to my bet, remove from chips, set talked = true
    let tableID;
    await db
      .query(
        "UPDATE user_table SET talked=true, lastaction='bet', bet= bet + $2, chips=chips-$2 WHERE player_id = $1 returning * ",
        [userID, betAmount]
      )
      .then(res => (tableID = res.rows[0].table_id));

    // if progress returns an object then return it to the callback
    return cb(null, await progress(userID, emitter));
  } catch (e) {
    if (e.notallowed || e.timedout) {
      return cb(e, null);
    }
    return cb({ unspecfiedDBError: "Could not bet" }, null);
  }
};

/**
 * Player action all in
 * @param {number} userID ID of user attempting the all in
 * @param {function} emitter Event emitter that can be called to emit events
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed errors or success message
 */
const allin = async (userID, emitter, cb) => {
  try {
    await checkIfUserAllowed(userID);

    // see if I have sufficient number of chips. show error if I don't
    const res = await db.query(
      "SELECT chips FROM user_table WHERE player_id = $1",
      [userID]
    );
    const totalChips = res.rows[0].chips;

    if (totalChips < 1) {
      throw { notallowed: "Can't bet more than number of chips owned." };
    }

    // add chips to my bet, remove from chips, set talked = true
    let tableID;
    await db
      .query(
        "UPDATE user_table SET talked=true, lastaction='all in', bet= bet + $2, chips=chips-$2 WHERE player_id = $1 returning * ",
        [userID, totalChips]
      )
      .then(res => (tableID = res.rows[0].table_id));

    //Attempt to progress the game
    await progress(userID, emitter);
    return cb(null, "All In");
  } catch (e) {
    if (e.notallowed || e.timedout) {
      return cb(e, null);
    }
    return cb({ unspecfiedDBError: "Could not bet" }, null);
  }
};

/**
 * Player action call
 * @param {number} userID ID of user attempting the call
 * @param {function} emitter Event emitter that can be called to emit events
 * @param {function} cb Callback function that accepts error or json response
 * @returns {function} Returns the callback function passed errors or success message
 */
const call = async (userID, emitter, cb) => {
  try {
    await checkIfUserAllowed(userID);

    const maxBet = await getMaxBet(userID);

    const res1 = await db.query(
      "SELECT chips FROM user_table WHERE player_id = $1",
      [userID]
    );
    const totalChips = res1.rows[0].chips;

    if (totalChips < maxBet) {
      return await allin(userID, emitter, cb);
    }

    // Match the highest bet
    // add chips to my bet, remove from chips, set talked = true
    let tableID;
    await db
      .query(
        "UPDATE user_table SET talked=true, lastaction='call', chips=chips-$2+bet, bet= $2 WHERE player_id = $1 returning * ",
        [userID, maxBet]
      )
      .then(res => (tableID = res.rows[0].table_id));

    // if progress returns an object then return it to the callback
    return cb(null, await progress(userID, emitter));
    //Attemp to progress the game
  } catch (e) {
    if (e.notallowed || e.timedout) {
      return cb(e, null);
    }

    return cb({ unspecfiedDBError: "Could not call" }, null);
  }
};

module.exports = {
  getTableId,
  getTable,
  createNewTable,
  all,
  joinTable,
  exitTable,
  check,
  fold,
  bet,
  call
};
