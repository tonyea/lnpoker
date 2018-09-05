const db = require("../db");
const { rankHandInt } = require("./Rank");

// @params NA
// @return table if already created, else false
// @desc find the first table in the DB. This is temporary until we add ability for multiple tables
const findTable = async () => {
  const { rows } = await db.query(
    "SELECT id, smallblind, bigblind, minplayers, maxplayers, minbuyin, maxbuyin, pot, roundname, board, status FROM tables limit 1"
  );

  if (rows.length < 1) {
    return false;
  }

  return rows[0];
};

// @params NA
// @return table object without players array
// @desc create a new table using default params instead of destructuring table arguments, start new round
const createNewTable = async userID => {
  const res = await db.query(
    "INSERT INTO tables DEFAULT VALUES returning id, smallblind, bigblind, minplayers, maxplayers, minbuyin, maxbuyin, pot, roundname, board, status "
  );

  // auto join newly created table
  await joinTable(res.rows[0].id, userID);

  return res.rows[0];
};

const buyIn = async (userID, tableID) => {
  const res = await db.query("SELECT minbuyin from TABLES WHERE id=$1", [
    tableID
  ]);
  const buyIn = res.rows[0].minbuyin;
  // withdraw from bank
  await db.query("UPDATE users SET bank = bank - $2 WHERE id=$1", [
    userID,
    buyIn
  ]);

  return buyIn;
};

// @params tableID and userID
// @return null
// @desc add user's id to user_table and distribute his cards from deck
const joinTable = async (tableID, userID) => {
  const errors = {};

  const buyin = await buyIn(userID, tableID);

  // append user id to table along with chips from bank | auto join the table you create
  await db.query(
    "INSERT INTO user_table(player_id, table_id, chips) VALUES ($1, $2, $3)",
    [userID, tableID, buyin]
  );

  //If there is no current game and we have enough players, start a new game. Set status to started
  const tableRow = await db.query(
    "SELECT status, minplayers from tables where id = $1",
    [tableID]
  );
  const playersRows = await db.query(
    "SELECT count(id) as numplayers from user_table where table_id = $1",
    [tableID]
  );

  const minPlayers =
    tableRow.rows.length > 0 ? tableRow.rows[0].minplayers : null;
  const numPlayers =
    playersRows.rows.length > 0 ? parseInt(playersRows.rows[0].numplayers) : 0;
  // return error if we don't find table
  if (minPlayers === null) {
    errors.table = "No table found";
    throw errors;
  }
  // check if we have minimum number of players
  if (numPlayers < minPlayers) {
    errors.players = "Not enough players";
    throw errors;
  }
  // start new round if status is 'waiting'
  if (tableRow.rows[0].status === "waiting") {
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
  }
};

// @desc - check if it is showdown
// @params - tableID of table
// returns bool
const checkShowdown = async userID => {
  let isShowdown = await db
    .query(
      "SELECT roundname FROM tables where id = (SELECT table_id from user_table WHERE player_id = $1)",
      [userID]
    )
    .then(res => res.rows[0].roundname === "Showdown");

  return isShowdown;
};

// @params tableID, userID
// @return array
// @desc return array of users found on table
const getPlayersAtTable = async (tableID, userID) => {
  // show opponents cards if showdown, else show null in opponents card
  let isShowdown = await checkShowdown(userID);

  const players = await db.query(
    `
    SELECT username, dealer, chips, talked, lastaction, bet, currentplayer, (CASE WHEN ($3 IS TRUE) THEN cards ELSE null END) as cards
    FROM users 
    INNER join user_table on users.id = user_table.player_id
    WHERE user_table.table_id=$1 and player_id!=$2
    union
    SELECT username, dealer, chips, talked, lastaction, bet, currentplayer, cards 
    FROM users 
    INNER join user_table on users.id = user_table.player_id
    WHERE user_table.table_id=$1 and player_id=$2`,
    [tableID, userID, isShowdown]
  );

  const playersArray = players.rows;
  if (playersArray.length > 0) {
    // First player after dealer is identified as small blind, next as big blind. So in 2 player game, p1 is dealer, p2 is sb, p1 is bb
    // default all to false
    playersArray.map(player => {
      player.isSmallBlind = false;
      player.isBigBlind = false;
    });
    const dealerIndex = playersArray.findIndex(
      player => player.dealer === true
    );

    //Identify Small and Big Blind player indexes
    let smallBlindIndex = dealerIndex + 1;
    if (smallBlindIndex >= playersArray.length) {
      smallBlindIndex = 0;
    }
    let bigBlindIndex = dealerIndex + 2;
    if (bigBlindIndex >= playersArray.length) {
      bigBlindIndex -= playersArray.length;
    }
    playersArray[smallBlindIndex].isSmallBlind = true;
    playersArray[bigBlindIndex].isBigBlind = true;
    return playersArray;
  }
  // else return empty array
  return [];
};

// @params tableID and userID
// @return bool
// @desc return true if user is found on table, else false
const isPlayerOnTable = async (userID, tableID) => {
  const result = await db.query(
    "SELECT username FROM users INNER join user_table on users.id = user_table.player_id WHERE user_table.player_id = $1 and user_table.table_id = $2",
    [userID, tableID]
  );

  if (result.rows.length > 0) {
    return true;
  }

  return false;
};

// @desc - join existing table
// @params - cb is a callback function that takes errors as it's first param, and table state as second. userID takes user id from requesting user
// returns errors or table data
const joinTableIfItExists = async (cb, userID) => {
  let table;
  try {
    table = await findTable();
    // create new table if none found
    if (!table) {
      table = await createNewTable(userID);

      table.players = await getPlayersAtTable(table.id, userID);

      return cb(null, table);
    }

    // return table if player is already on table
    if (await isPlayerOnTable(userID, table.id)) {
      table.players = await getPlayersAtTable(table.id, userID);
      return cb(null, table);
    }

    // set player object to requesting user's id if above are false
    // add the user to the table
    await joinTable(table.id, userID);
    // instead of querying the db again, change the status here
    table.status = "started";

    table.players = await getPlayersAtTable(table.id, userID);
  } catch (error) {
    return cb(error);
  }
  return cb(null, table);
};

// @desc - join existing table
// @params - userID from request
// returns errors or table data
const exitTable = async userID => {
  await db.query("DELETE FROM user_table WHERE player_id = $1", [userID]);
};

// @desc - trigger this to start a new round
// @params - tableID
// returns null
const newRound = async tableID => {
  // get all players at table
  const dbRes = await db.query(
    "SELECT player_id, dealer from user_table where table_id = $1 order by id",
    [tableID]
  );
  // all players at table
  const players = dbRes.rows;

  // deck will contain 52 cards to start
  const deck = fillDeck();

  // Deal 2 cards to each player
  for (i = 0; i < players.length; i += 1) {
    const cards = "{" + deck.pop() + "," + deck.pop() + "}";
    await db.query("UPDATE user_table SET cards = $1 WHERE player_id=$2", [
      cards,
      players[i].player_id
    ]);

    // this.game.bets[i] = 0;
    // this.game.roundBets[i] = 0;
  }

  // Force Blind Bets
  // find small blind user and small blind amount
  const dealerIndex = players.findIndex(player => player.dealer === true);
  //Identify Small and Big Blind player indexes
  let smallBlindIndex = dealerIndex + 1;
  if (smallBlindIndex >= players.length) {
    smallBlindIndex = 0;
  }
  let bigBlindIndex = dealerIndex + 2;
  if (bigBlindIndex >= players.length) {
    bigBlindIndex -= players.length;
  }
  // get currentPlayer
  let currentPlayerIndex = dealerIndex + 3;
  if (currentPlayerIndex >= players.length) {
    currentPlayerIndex -= players.length;
  }
  const smallBlindPlayerID = players[smallBlindIndex].player_id;
  const bigBlindPlayerID = players[bigBlindIndex].player_id;
  const currentPlayerID = players[currentPlayerIndex].player_id;
  // deduct small blind amount from small blind user
  await db.query(
    "UPDATE user_table SET chips = chips-(SELECT smallblind from TABLES WHERE id=$2), bet=(SELECT smallblind from TABLES WHERE id=$2) WHERE player_id=$1",
    [smallBlindPlayerID, tableID]
  );
  await db.query(
    "UPDATE user_table SET chips = chips-(SELECT bigblind from TABLES WHERE id=$2), bet=(SELECT bigblind from TABLES WHERE id=$2) WHERE player_id=$1",
    [bigBlindPlayerID, tableID]
  );

  // // set current player
  await db.query(
    "UPDATE user_table SET currentplayer = true WHERE player_id=$1 AND table_id=$2",
    [currentPlayerID, tableID]
  );
  await db.query(
    "UPDATE user_table SET currentplayer = false WHERE player_id!=$1 AND table_id=$2",
    [currentPlayerID, tableID]
  );

  // persist remaining deck
  await db.query("UPDATE tables SET deck = $1 WHERE id=$2 RETURNING *", [
    "{" + deck.join() + "}",
    tableID
  ]);
};

// @desc - trigger this after a round is complete
// @params - tableID
// returns null
const initNewRound = async userID => {
  console.log("roundname changed", userID);

  // // get all players at table
  // let players = [];
  // await db
  //   .query(
  //     "SELECT player_id, dealer from user_table where table_id = (SELECT table_id FROM user_table WHERE player_id = $1) order by id",
  //     [userID]
  //   )
  //   .then(res => (players = res.rows));

  // // cycle dealer clockwise
  // let dealerIndex = players.findIndex(player => player.dealer === true) + 1;
  // if (dealerIndex >= players.length) {
  //   dealerIndex = 0;
  // }
  // const dealerID = players[dealerIndex].player_id;
  // await db.query("UPDATE user_table SET dealer=true WHERE player_id=$1", [
  //   dealerID
  // ]);

  // // set pot to 0, empty deck in tables, empty board in tables
  // await db.query(
  //   "UPDATE tables SET pot=0, deck='{}', board='{}' WHERE id=(SELECT table_id FROM user_table WHERE player_id = $1)",
  //   [userID]
  // );

  // // set roundname to Deal
  await setRoundName("Deal", userID);

  // // set all bets to 0 in user_table, set each player last action to null, talked to false, cards to empty array
  // await db.query(
  //   "UPDATE user_table SET bet=0, lastaction=null, talked=false, cards='{}' WHERE table_id=(SELECT table_id FROM user_table WHERE player_id = $1)",
  //   [userID]
  // );

  // // call new round
  // // this.NewRound();
};

// function to create and shuffle a deck of 52 cards
const fillDeck = () => {
  const deck = [];
  deck.push("AS");
  deck.push("KS");
  deck.push("QS");
  deck.push("JS");
  deck.push("TS");
  deck.push("9S");
  deck.push("8S");
  deck.push("7S");
  deck.push("6S");
  deck.push("5S");
  deck.push("4S");
  deck.push("3S");
  deck.push("2S");
  deck.push("AH");
  deck.push("KH");
  deck.push("QH");
  deck.push("JH");
  deck.push("TH");
  deck.push("9H");
  deck.push("8H");
  deck.push("7H");
  deck.push("6H");
  deck.push("5H");
  deck.push("4H");
  deck.push("3H");
  deck.push("2H");
  deck.push("AD");
  deck.push("KD");
  deck.push("QD");
  deck.push("JD");
  deck.push("TD");
  deck.push("9D");
  deck.push("8D");
  deck.push("7D");
  deck.push("6D");
  deck.push("5D");
  deck.push("4D");
  deck.push("3D");
  deck.push("2D");
  deck.push("AC");
  deck.push("KC");
  deck.push("QC");
  deck.push("JC");
  deck.push("TC");
  deck.push("9C");
  deck.push("8C");
  deck.push("7C");
  deck.push("6C");
  deck.push("5C");
  deck.push("4C");
  deck.push("3C");
  deck.push("2C");

  //Shuffle the deck array with Fisher-Yates
  var i, j, tempi, tempj;
  for (i = 0; i < deck.length; i += 1) {
    j = Math.floor(Math.random() * (i + 1));
    tempi = deck[i];
    tempj = deck[j];
    deck[i] = tempj;
    deck[j] = tempi;
  }

  return deck;
};

// @desc - player action check
// @params - user id of player doing game action - check, cb that takes error or table json
// returns callback
const check = async (userID, cb) => {
  const errors = {};
  try {
    // Disable all actions on showdown
    await checkShowdown(userID).then(res => {
      if (res) {
        errors.notallowed = "No moves allowed after showdown";
        return cb(errors, null);
      }
    });

    // check if it is my turn
    const myTurn = await checkTurn(userID);
    if (!myTurn) {
      // return error if not
      errors.notallowed = "Wrong user has made a move";
      return cb(errors, null);
    }

    // check that the person requesting the check is allowed to check
    // if any of the other players have made bets larger than you then you can't check
    const otherBetsRes = await db.query(
      `SELECT player_id, bet 
        FROM user_table 
        WHERE bet > (SELECT bet from user_table WHERE player_id = $1) AND table_id = (SELECT table_id from user_table WHERE player_id = $1)`,
      [userID]
    );
    if (otherBetsRes.rows.length > 0) {
      errors.notallowed = "Check not allowed, replay please";
      return cb(errors, null);
    }

    const res = await db.query(
      "UPDATE user_table SET talked=true, lastaction='check' where player_id = $1 returning * ",
      [userID]
    );
    if (res.rows.length > 0) {
      // if progress returns an object then return it to the callback
      return cb(null, await progress(userID));
    }
    errors.notupdated = "Did not update action and talked state";
    return cb(errors, null);
  } catch (e) {
    errors.notallowed = "Check not allowed, replay please";
    console.log(e);
    return cb(errors, null);
  }

  // progress the table
};

// @desc - player action fold
// @params - user id of player doing game action - fold, cb that takes error or table json
// returns callback
const fold = async (userID, cb) => {
  const errors = {};
  try {
    // Disable all actions on showdown
    await checkShowdown(userID).then(res => {
      if (res) {
        errors.notallowed = "No moves allowed after showdown";
        return cb(errors, null);
      }
    });

    // check if it is my turn
    const myTurn = await checkTurn(userID);
    if (!myTurn) {
      // return error if not
      errors.notallowed = "Wrong user has made a move";
      return cb(errors, null);
    }

    // add my bet to the pot
    await db.query(
      "UPDATE tables SET pot=(SELECT bet from user_table WHERE player_id=$1) WHERE id = (SELECT table_id from user_table WHERE player_id = $1) returning * ",
      [userID]
    );
    //set my bet field to 0, set talked to true and last action to fold
    const res = await db.query(
      "UPDATE user_table SET talked=true, lastaction='fold', bet=0 where player_id = $1 returning * ",
      [userID]
    );
    if (res.rows.length > 0) {
      // if progress returns an object then return it to the callback
      return cb(null, await progress(userID));
    }
    errors.notupdated = "Did not update action and talked state";
    return cb(errors, null);

    //Attemp to progress the game
    // progress(this.table);
  } catch (e) {
    errors.notallowed = "Fold not allowed, replay please";
    return cb(errors, null);
  }
};

// @desc - player action bet
// @params - user id of player doing game action - bet, cb that takes error or table json
// returns callback
const bet = async (userID, betAmount, cb) => {
  const errors = {};
  try {
    // Disable all actions on showdown
    await checkShowdown(userID).then(res => {
      if (res) {
        errors.notallowed = "No moves allowed after showdown";
        return cb(errors, null);
      }
    });

    // check if it is my turn
    const myTurn = await checkTurn(userID);
    if (!myTurn) {
      // return error if not
      errors.notallowed = "Wrong user has made a move";
      return cb(errors, null);
    }

    // see if I have sufficient number of chips. show error if I don't
    const res = await db.query(
      "SELECT chips FROM user_table WHERE player_id = $1",
      [userID]
    );
    const totalChips = res.rows[0].chips;

    if (totalChips < betAmount) {
      return await allin(userID, cb);
    }

    // add chips to my bet, remove from chips, set talked = true
    await db.query(
      "UPDATE user_table SET talked=true, lastaction='bet', bet= bet + $2, chips=chips-$2 WHERE player_id = $1 returning * ",
      [userID, betAmount]
    );

    // if progress returns an object then return it to the callback
    return cb(null, await progress(userID));
  } catch (e) {
    errors.notallowed = "Bet not allowed, replay please";
    return cb(errors, null);
  }
};

const allin = async (userID, cb) => {
  const errors = {};
  try {
    // Disable all actions on showdown
    await checkShowdown(userID).then(res => {
      if (res) {
        errors.notallowed = "No moves allowed after showdown";
        return cb(errors, null);
      }
    });

    // check if it is my turn
    const myTurn = await checkTurn(userID);
    if (!myTurn) {
      // return error if not
      errors.notallowed = "Wrong user has made a move";
      return cb(errors, null);
    }

    // see if I have sufficient number of chips. show error if I don't
    const res = await db.query(
      "SELECT chips FROM user_table WHERE player_id = $1",
      [userID]
    );
    const totalChips = res.rows[0].chips;

    if (totalChips < 1) {
      errors.notallowed = "Can't bet more than number of chips owned.";
      return cb(errors, null);
    }

    // add chips to my bet, remove from chips, set talked = true
    await db.query(
      "UPDATE user_table SET talked=true, lastaction='all in', bet= bet + $2, chips=chips-$2 WHERE player_id = $1 returning * ",
      [userID, totalChips]
    );

    //Attempt to progress the game
    await progress(userID);
    return cb(null, "All In");
  } catch (e) {
    errors.notallowed = "Bet not allowed, replay please";
    return cb(errors, null);
  }
};

const getMaxBet = async userID => {
  const res = await db.query(
    `SELECT max(bet) as max
    FROM user_table 
      WHERE table_id = (select table_id 
        from user_table
                        where player_id = $1)`,
    [userID]
  );
  return parseInt(res.rows[0].max);
};

const call = async (userID, cb) => {
  const errors = {};
  try {
    // Disable all actions on showdown
    await checkShowdown(userID).then(res => {
      if (res) {
        errors.notallowed = "No moves allowed after showdown";
        return cb(errors, null);
      }
    });

    // check if it is my turn
    const myTurn = await checkTurn(userID);
    if (!myTurn) {
      // return error if not
      errors.notallowed = "Wrong user has made a move";
      return cb(errors, null);
    }

    const maxBet = await getMaxBet(userID);

    const res1 = await db.query(
      "SELECT chips FROM user_table WHERE player_id = $1",
      [userID]
    );
    const totalChips = res1.rows[0].chips;

    if (totalChips < maxBet) {
      return await allin(userID, cb);
    }

    // Match the highest bet
    // add chips to my bet, remove from chips, set talked = true
    await db.query(
      "UPDATE user_table SET talked=true, lastaction='call', chips=chips-$2+bet, bet= $2 WHERE player_id = $1 returning * ",
      [userID, maxBet]
    );

    // if progress returns an object then return it to the callback
    return cb(null, await progress(userID));
    //Attemp to progress the game
  } catch (e) {
    errors.notallowed = "Bet not allowed, replay please";
    return cb(errors, null);
  }
};

const getGame = async userID => {
  const res = await db.query(
    `
    SELECT user_table.id as id, username, currentplayer, bet, cards, player_id, table_id, status, roundname, board, lastaction, rank, rankname, roundbet, chips  
    FROM user_table 
    INNER JOIN TABLES
    ON user_table.table_id = tables.id
    INNER JOIN USERS
    ON users.id = user_table.player_id
    WHERE table_id = (SELECT table_id 
      FROM user_table
      WHERE player_id = $1)
      ORDER BY user_table.id;
      `,
    [userID]
  );

  return res.rows;
};

const progress = async userID => {
  const userTable = await getGame(userID);

  const status = userTable[0].status;
  const roundname = userTable[0].roundname;
  const board = userTable[0].board;
  const tableID = userTable[0].table_id;
  // if status of game is started then progress, else null
  if (status === "started") {
    // only progress game if it is end of round
    if ((await checkForEndOfRound(userID)) === true) {
      // if current player is last player, first player is set as current player, else move current player 1 down the table.
      const currentPlayerIndex = userTable.findIndex(
        user => user.currentplayer === true
      );
      const newCurrentPlayerIndex =
        currentPlayerIndex >= userTable.length - 1
          ? currentPlayerIndex - userTable.length + 1
          : currentPlayerIndex + 1;
      const newCurrentPlayerID = userTable[newCurrentPlayerIndex].player_id;

      await setCurrentPlayer(newCurrentPlayerID, tableID);

      //Move all bets to the pot
      await moveAllBetsToPot(userID);

      if (roundname === "River") {
        await setRoundName("Showdown", userID);
        //Evaluate each hand
        for (let j = 0; j < userTable.length; j += 1) {
          let cards = userTable[j].cards.concat(board);
          let hand = rankHand({ cards });
          await setRank(userTable[j].player_id, hand);
        }
        // compile check for winner and check for bankrupt into one messages object and if it exists then return it
        let endRoundMessage = {};
        endRoundMessage.winner = await checkForWinner(userID);
        endRoundMessage.bankrupt = await checkForBankrupt(userID);
        if (
          endRoundMessage.winner.length > 0 ||
          endRoundMessage.bankrupt.length > 0
        ) {
          return endRoundMessage;
        }
      } else if (roundname === "Turn") {
        await setRoundName("River", userID);
        await burnTurn(1, userID);
        await removeTalked(userID);
      } else if (roundname === "Flop") {
        await setRoundName("Turn", userID);
        await burnTurn(1, userID);
        await removeTalked(userID);
      } else if (roundname === "Deal") {
        await setRoundName("Flop", userID);
        await burnTurn(3, userID);
        await removeTalked(userID);
      }
    }
    // return success message
    return "Success";
  }
};

const setRoundName = async (roundname, userID) => {
  await db.query(
    `
    UPDATE tables 
    SET roundname = $1
    WHERE id = (
        SELECT table_id 
        FROM user_table
        WHERE player_id = $2
    )      
  `,
    [roundname, userID]
  );
};

const burnTurn = async (numTurn, userID) => {
  let deck, board, tableID;

  // get deck from DB
  await db
    .query(
      "SELECT deck, board, id FROM tables WHERE id = (SELECT table_id FROM user_table WHERE player_id = $1)",
      [userID]
    )
    .then(res => {
      deck = res.rows[0].deck;
      board = res.rows[0].board;
      tableID = res.rows[0].id;
    });

  // burn one card
  deck.pop(); //Burn a card

  // Deal numTurn cards to board
  for (i = 0; i < numTurn; i += 1) {
    board.push(deck.pop());
  }

  // prep variable for postgres query
  board = "{" + board.join() + "}";
  // persist remaining deck and append to board
  await db.query(
    "UPDATE tables SET deck = $1, board= $2 WHERE id=$3 RETURNING *",
    ["{" + deck.join() + "}", board, tableID]
  );
};

// set rank in DB
const setRank = async (userID, hand) => {
  // console.log(rank);
  const rank = hand.rank;
  const rankname = hand.message;
  await db.query(
    "UPDATE user_table SET rank = $1, rankname=$2 WHERE player_id=$3",
    [rank, rankname, userID]
  );
};

const checkForWinner = async userID => {
  let i, j, k, l, maxRank, winners, part, prize, allInPlayer, minBets, roundEnd;

  const players = await getGame(userID);

  //Identify winner(s)
  winners = [];
  maxRank = 0.0;
  for (k = 0; k < players.length; k += 1) {
    const rank = parseFloat(players[k].rank);
    // console.log(
    //   "rank",
    //   rank,
    //   "maxrank",
    //   maxRank,
    //   "players[k].lastaction",
    //   players[k].lastaction,
    //   "players[k].player_id",
    //   players[k].player_id
    // );
    // max rank is initially 0, so no player will trigger the first if. Will start by checking second player's rank against maxrank
    if (rank === maxRank && players[k].lastaction !== "fold") {
      // console.log("maxRank 1 ", maxRank);
      winners.push(players[k]);
    }
    if (rank > maxRank && players[k].lastaction !== "fold") {
      // start by setting the first player's rank to the max rank
      // console.log("maxRank 2 ", maxRank);
      maxRank = rank;
      // console.log("maxRank 3 ", maxRank);
      // reset winners array to 0
      winners.splice(0, winners.length);
      // push the first player to the winners array
      winners.push(players[k]);
    }
  }

  part = 0;
  prize = 0;
  // check if any of the winners is all in
  allInPlayer = checkForAllInPlayer(winners);
  if (allInPlayer.length > 0) {
    // if yes, then set the minbets to the lowest all in player's bet amount
    minBets = winners[0].roundbet;
    for (j = 1; j < allInPlayer.length; j += 1) {
      if (winners[j].roundbet !== 0 && winners[j].roundbet < minBets) {
        minBets = winners[j].roundbet;
      }
    }
    part = parseInt(minBets, 10);
  } else {
    part = parseInt(winners[0].roundbet, 10);
  }

  // if a player has less than the winner's part then he loses only that part not more than the winner has in roundBets
  for (l = 0; l < players.length; l += 1) {
    if (players[l].roundbet > part) {
      prize += part;
      const lostAmount = players[l].roundbet - part;
      await setRoundBet(players[l].player_id, lostAmount);
      players[l].roundbet = lostAmount;
    } else {
      prize += players[l].roundbet;
      await setRoundBet(players[l].player_id, 0);
      players[l].roundbet = 0;
    }
  }

  // for each winner, distribute his prize split evenly
  let winnerList = [];
  for (i = 0; i < winners.length; i += 1) {
    let winnerPrize = parseFloat(prize / winners.length);
    let winningPlayer = winners[i];
    await setChipsAndPot(winningPlayer.player_id, winnerPrize);
    if (winners[i].roundbet === 0) {
      await setLastAction(winningPlayer.player_id, "fold");
    }
    // send message about winner
    winnerList.push({
      playerName: winningPlayer.username,
      amount: winnerPrize,
      hand: winningPlayer.rankname,
      chips: parseFloat(winningPlayer.chips) + winnerPrize
    });
  }

  // if any player doesn't have roundbet of 0, check for winner again
  roundEnd = true;
  for (l = 0; l < players.length; l += 1) {
    if (players[l].roundbet !== 0) {
      roundEnd = false;
    }
  }
  if (roundEnd === false) {
    await checkForWinner(userID);
  }

  // return winners array
  return winnerList;
};

const checkForBankrupt = async userID => {
  // if a player on the table has 0 chips
  // remove player from table
  let losers = [];
  await db
    .query(
      `
        DELETE FROM user_table
        WHERE table_id = (SELECT table_id FROM user_table WHERE player_id = $1)
        AND chips = 0
        RETURNING *
        `,
      [userID]
    )
    .then(res => {
      if (res.rows.length > 0) {
        // for each player that has gone bankrupt, send a message that he has left the table
        res.rows.forEach(
          player => losers.push(player.player_id) // + " has gone bankrupt and left the table!"
        );
      }
    });
  return losers;
};

// return players that are all in
const checkForAllInPlayer = players => {
  let i, allInPlayer;
  allInPlayer = [];
  for (i = 0; i < players.length; i += 1) {
    if (players[i].lastaction === "all in") {
      allInPlayer.push(players[i]);
    }
  }
  return allInPlayer;
};

// set talked field to false for all users on table
const removeTalked = async userID => {
  await db.query(
    "UPDATE user_table SET talked = false WHERE table_id = (SELECT table_id FROM user_table WHERE player_id = $1)",
    [userID]
  );
};

// set roundbet field to input
const setRoundBet = async (userID, amount) => {
  await db.query("UPDATE user_table SET roundbet = $2 WHERE player_id=$1", [
    userID,
    amount
  ]);
};

// set chips field to input
const setChipsAndPot = async (userID, amount) => {
  await db.query(
    "UPDATE user_table SET chips = chips + $2 WHERE player_id=$1",
    [userID, amount]
  );

  await db.query(
    "UPDATE tables SET pot = 0 WHERE id = (SELECT table_id FROM user_table WHERE player_id = $1)",
    [userID]
  );
};

// set lastaction field to input
const setLastAction = async (userID, action) => {
  await db.query("UPDATE user_table SET lastaction = $2 WHERE player_id=$1", [
    userID,
    action
  ]);
};

// get rank for the hand passed through
const rankHand = hand => {
  let myResult = rankHandInt(hand);
  hand.rank = myResult.rank;
  hand.message = myResult.message;

  return hand;
};

const setCurrentPlayer = async (userID, tableID) => {
  await db.query(
    "UPDATE user_table SET currentplayer = true WHERE player_id=$1 AND table_id=$2",
    [userID, tableID]
  );
  await db.query(
    "UPDATE user_table SET currentplayer = false WHERE player_id!=$1 AND table_id=$2",
    [userID, tableID]
  );
};

const moveAllBetsToPot = async userID => {
  // update pot
  await db.query(
    `
    UPDATE tables 
    SET pot = pot + (
        SELECT SUM(bet) 
          FROM user_table
          WHERE table_id = (
              SELECT table_id 
              FROM user_table
              WHERE player_id = $1
          )
      )
    WHERE id = (
        SELECT table_id 
        FROM user_table
        WHERE player_id = $1
    )
  `,
    [userID]
  );

  // append roundBets with bet amounts. set bet to 0
  await db.query(
    `
    UPDATE user_table 
    SET roundBet = bet+ roundBet, bet=0
    WHERE table_id = (
        SELECT table_id 
        FROM user_table
        WHERE player_id = $1
    )      
  `,
    [userID]
  );
};

// gets table, returns bool
const checkForEndOfRound = async userID => {
  let i, players;
  let endOfRound = true;
  const maxBet = await getMaxBet(userID);
  await db
    .query(
      `
      SELECT player_id, lastaction, bet, table_id, talked
      FROM user_table 
      WHERE table_id = (SELECT table_id 
                        FROM user_table
                        WHERE player_id = $1)
                `,
      [userID]
    )
    .then(res => {
      players = res.rows;
    });
  //For each player, check
  for (i = 0; i < players.length; i += 1) {
    // if player has not folded
    if (players[i].lastaction !== "fold") {
      // and player has not talked(bet) or player's bet is less than the highest bet at the table
      if (players[i].talked === false || players[i].bet !== maxBet) {
        // and player is not all in
        if (players[i].lastaction !== "all in") {
          //then set current player as this player and end of round is false
          await setCurrentPlayer(players[i].player_id, players[i].table_id);
          endOfRound = false;
        }
      }
    }
  }
  return endOfRound;
};

// @desc - check if it is player's turn
// @params - userID of player being checked
// returns bool
const checkTurn = async userID => {
  const res = await db.query(
    "SELECT id, currentplayer FROM user_table WHERE user_table.player_id = $1",
    [userID]
  );

  // instead of error
  if (res.rows.length !== 1) {
    return false;
  }
  // if he is current player return true, else false
  return res.rows[0].currentplayer;
};

module.exports = {
  joinTableIfItExists,
  exitTable,
  check,
  fold,
  bet,
  call,
  initNewRound
};
