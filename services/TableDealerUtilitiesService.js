const db = require("../db");
const { rankHandInt } = require("./RankService");
const { getMaxBet } = require("./TableUtilityService");

/**
 * Identifies winners of a round
 * @param {number} userID user who took the action that triggered a round progress event
 * @return {Array} Array containing list of winners. Returns empty array if none.
 */
const checkForWinner = async userID => {
  let i, j, k, l, maxRank, winners, part, prize, allInPlayer, minBets, roundEnd;

  const players = await getGame(userID);

  //Identify winner(s)
  winners = [];
  maxRank = 0.0;
  for (k = 0; k < players.length; k += 1) {
    const rank = parseFloat(players[k].rank);

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

/**
 * Identifies bankrupts after a round
 * @param {number} userID user who took the action that triggered a round progress event
 * @return {Array} Array containing list of bankrupt users. Returns empty array if none.
 */
const checkForBankrupt = async userID => {
  try {
    // if a player on the table has 0 chips
    // remove player from table
    let losers = [];
    const loserRes = await db.query(
      `
        DELETE FROM user_table
        WHERE table_id = (SELECT table_id FROM user_table WHERE player_id = $1)
        AND chips = 0
        RETURNING player_id
        `,
      [userID]
    );
    const loserIDs = [];
    if (loserRes.rows.length > 0) {
      loserRes.rows.forEach(player => loserIDs.push(player.player_id));
      const loserIDsString = loserIDs.join();
      // get usernames of all users by passing through list of userids
      await db
        .query("SELECT username FROM users WHERE id in($1)", [loserIDs.join()])
        .then(res => {
          // for each player that has gone bankrupt, send a message that he has left the table
          res.rows.forEach(
            player =>
              losers.push({
                playerName: player.username
              }) // + " has gone bankrupt and left the table!"
          );
        });
    }
    return losers;
  } catch (error) {
    return [];
  }
};

// return players that are all in

/**
 * Identifies list of players that are all in at the end of a round
 * @param {number} userID user who took the action that triggered a round progress event
 * @return {Array} Array containing list of all in players. Returns empty array if none.
 */
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

/**
 * Get details of active game where specified user is seated. Only includes seated players.
 * @param {number} userID Get details of game where userID
 */
const getGame = async userID => {
  const res = await db.query(
    `
    SELECT user_table.id as id, username, currentplayer, bet, cards, player_id, table_id, seated, status, roundname, board, lastaction, rank, rankname, roundbet, chips  
    FROM user_table 
    INNER JOIN TABLES
    ON user_table.table_id = tables.id
    INNER JOIN USERS
    ON users.id = user_table.player_id
    WHERE table_id = (SELECT table_id 
      FROM user_table
      WHERE player_id = $1)
    AND seated=true
    ORDER BY user_table.id;
      `,
    [userID]
  );

  return res.rows;
};

/**
 * Moves all bets to pot from bet field. And updates roundBet field in DB.
 * @param {number} userID
 * @return {Promise<void>}
 */
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
          ) AND seated=true
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
    ) AND seated = true      
  `,
    [userID]
  );
};

/**
 * If there are still players who haven't folded, or who's bets are less than the max bet, or haven't made an action then the round isn't over yet.
 * @param {number} userID
 * @returns {bool}
 */
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
      AND seated = true
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

/**
 * Burns a card and turns number of cards specified
 * @param {number} numturn number of cards to turn after burning
 * @param {number} userID used to identify which game to update
 * @return {Promise<void>}
 */
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

/**
 * Store rank of hand in DB
 * @param {number} userID owner of hand
 * @param {Array} hand array of 2 cards
 * @returns {Promise<void>}
 */
const setRank = async (userID, hand) => {
  // console.log(rank);
  const rank = hand.rank;
  const rankname = hand.message;
  await db.query(
    "UPDATE user_table SET rank = $1, rankname=$2 WHERE player_id=$3",
    [rank, rankname, userID]
  );
};

/**
 * Set talked field to false for all users on table
 * @param {number} userID
 * @return {Promise<void>}
 */
const removeTalked = async userID => {
  await db.query(
    "UPDATE user_table SET talked = false WHERE table_id = (SELECT table_id FROM user_table WHERE player_id = $1)",
    [userID]
  );
};

/**
 * Set roundbet field to input
 * @param {number} userID
 * @param {number} amount
 * @return {Promise<void>}
 */
const setRoundBet = async (userID, amount) => {
  await db.query("UPDATE user_table SET roundbet = $2 WHERE player_id=$1", [
    userID,
    amount
  ]);
};

/**
 * Set chips field to input and resets pot to 0.
 * @param {number} userID
 * @param {number} amount
 * @return {Promise<void>}
 */
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

/**
 * Set lastaction field to input.
 * @param {number} userID
 * @param {number} action
 * @return {Promise<void>}
 */
const setLastAction = async (userID, action) => {
  await db.query("UPDATE user_table SET lastaction = $2 WHERE player_id=$1", [
    userID,
    action
  ]);
};

/**
 * Get rank for the hand passed through.
 * @param {object} hand contains 7 cards. Two from hand and 5 from board
 * @return {object} returns same hand with two new properties, rank and message
 */
const rankHand = hand => {
  let myResult = rankHandInt(hand);
  hand.rank = myResult.rank;
  hand.message = myResult.message;

  return hand;
};

/**
 * Set specified userID as currentplayer
 * @param {number} userID
 * @param {number} tableID
 * @return {Promise<void>}
 */
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

/**
 * Set roundname to specified name
 * @param {string} roundname
 * @param {number} userID
 * @return {Promise<void>}
 */
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

/**
 * Function to create and shuffle a deck of 52 cards
 * @returns {Array} Returns array with deck of shuffled 52 cards
 */
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

module.exports = {
  checkForWinner,
  checkForBankrupt,
  getGame,
  rankHand,
  moveAllBetsToPot,
  checkForEndOfRound,
  burnTurn,
  setRank,
  removeTalked,
  setRoundName,
  fillDeck,
  setCurrentPlayer
};
