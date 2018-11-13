const db = require("../db");

/**
 * Get table based on ID. Throw error if none found.
 * @param {number} tableID ID of table
 * @returns {object} Returns basic information about table
 */
const findTableByID = async tableID => {
  const { rows } = await db.query(
    "SELECT id, smallblind, bigblind, minplayers, maxplayers, minbuyin, maxbuyin, pot, roundname, board, status, timeout FROM tables WHERE id = $1",
    [tableID]
  );

  if (rows.length < 1) {
    throw { tablenotfound: "Table not found" };
  }

  return rows[0];
};

/**
 * Get tableID if user is found on any table
 * @param {number} userID ID of user
 * @returns {number|boolean} Returns tableID if user is found on any table, else false
 */
const isPlayerOnAnyTable = async userID => {
  const result = await db.query(
    "SELECT table_id FROM user_table WHERE player_id = $1",
    [userID]
  );

  if (result.rows.length > 0) {
    return result.rows[0].table_id;
  }

  return false;
};

/**
 * Check if the round is in Showdown. I.e. All 5 cards are on board (River) and all bets have been placed.
 * @param {number} userID ID of user
 * @returns {boolean} Returns true if roundname is showdown, else false
 */
const checkShowdown = async userID => {
  let isShowdown = await db
    .query(
      "SELECT roundname FROM tables where id = (SELECT table_id from user_table WHERE player_id = $1)",
      [userID]
    )
    .then(res => res.rows[0].roundname === "Showdown");

  return isShowdown;
};

/**
 * Get list of players seated and unseated at a particular table
 * @param {number} tableID ID of table
 * @param {number} userID ID of user calling the function. This is to identify and hide other users' private information
 * @returns {Array} Array of users found on table
 */
const getPlayersAtTable = async (tableID, userID) => {
  // show opponents cards if showdown, else show null in opponents card
  let isShowdown = await checkShowdown(userID);

  const players = await db.query(
    `
    SELECT username, user_table.id as utid, dealer, chips, talked, lastaction, bet, currentplayer, action_timestamp, seated, (CASE WHEN ($3 IS TRUE) THEN cards ELSE null END) as cards
    FROM users 
    INNER join user_table on users.id = user_table.player_id
    WHERE user_table.table_id=$1 and player_id!=$2
    union
    SELECT username, user_table.id as utid, dealer, chips, talked, lastaction, bet, currentplayer, action_timestamp, seated, cards 
    FROM users 
    INNER join user_table on users.id = user_table.player_id
    WHERE user_table.table_id=$1 and player_id=$2
    ORDER BY utid
    `,
    [tableID, userID, isShowdown]
  );

  // only get blinds on seated players
  let playersArray = [];
  const unseatedPlayersArray = players.rows.filter(player => !player.seated);
  const seatedPlayersArray = players.rows.filter(player => player.seated);
  if (seatedPlayersArray.length > 0) {
    // First player after dealer is identified as small blind, next as big blind. So in 2 player game, p1 is dealer, p2 is sb, p1 is bb
    // default all to false
    seatedPlayersArray.map(player => {
      player.isSmallBlind = false;
      player.isBigBlind = false;
    });
    const dealerIndex = seatedPlayersArray.findIndex(
      player => player.dealer === true
    );

    //Identify Small and Big Blind player indexes
    let smallBlindIndex = dealerIndex + 1;
    if (smallBlindIndex >= seatedPlayersArray.length) {
      smallBlindIndex = 0;
    }
    let bigBlindIndex = dealerIndex + 2;
    if (bigBlindIndex >= seatedPlayersArray.length) {
      bigBlindIndex -= seatedPlayersArray.length;
    }
    seatedPlayersArray[smallBlindIndex].isSmallBlind = true;
    seatedPlayersArray[bigBlindIndex].isBigBlind = true;

    playersArray = playersArray.concat(seatedPlayersArray);
  }
  if (unseatedPlayersArray.length > 0) {
    // default all to false
    unseatedPlayersArray.map(player => {
      player.isSmallBlind = false;
      player.isBigBlind = false;
    });
    playersArray = playersArray.concat(unseatedPlayersArray);
  }
  return playersArray;
};

/**
 * Check if the user is allowed to make an action. No action allowed at showdown, out of turn, if unseated, if timed out.
 * @param {number} userID
 * @returns {bool|errors} returns true or throws error if false
 */
const checkIfUserAllowed = async userID => {
  const errors = {};
  // no moves allowed at showdown
  let isShowdown, timestamp, timeout, isNotSeated, isNotCurrentPlayer;
  await db
    .query(
      "SELECT roundname, timeout FROM tables where id = (SELECT table_id from user_table WHERE player_id = $1)",
      [userID]
    )
    .then(res => {
      isShowdown = res.rows[0].roundname === "Showdown";
      timeout = res.rows[0].timeout;
    });

  if (isShowdown) {
    throw { notallowed: "No moves allowed after showdown" };
  }

  // check if user is seated at table
  await db
    .query(
      "SELECT seated, action_timestamp, currentplayer FROM user_table WHERE player_id = $1",
      [userID]
    )
    .then(res => {
      isNotSeated = !res.rows[0].seated;
      timestamp = res.rows[0].action_timestamp;
      isNotCurrentPlayer = !res.rows[0].currentplayer;
    });

  if (isNotSeated) {
    throw { notallowed: "Not yet seated" };
  }

  // check if it is user's Turn
  if (isNotCurrentPlayer) {
    throw { notallowed: "Wrong user has made a move" };
  }

  // check if user is timed out and force current player exit if true
  const isTimedOut = new Date(timestamp).getTime() + timeout <= Date.now();
  if (isTimedOut) {
    throw { timedout: "User has timed out" };
  }

  return true;
};

/**
 * Get highest bet at current table
 * @param {number} userID
 * @return {number} Returns highest bet amount
 */
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

module.exports = {
  findTableByID,
  isPlayerOnAnyTable,
  getPlayersAtTable,
  checkIfUserAllowed,
  getMaxBet
};
