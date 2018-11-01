const db = require("../db");
const {
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
} = require("./TableDealerUtilitiesService");

/**
 * Remove last player from table and delete table.
 * @param {number} playerID
 * @returns {string} returns success message
 */
const kickLastPlayer = async playerID => {
  let tobank, tableID, seated;
  // get chips and bet that will be returned to bank
  await db
    .query(
      "SELECT chips+bet as money, table_id, seated FROM user_table WHERE player_id = $1",
      [playerID]
    )
    .then(dbres => {
      tobank = dbres.rows[0].money;
      tableID = dbres.rows[0].table_id;
      seated = dbres.rows[0].seated;
    });

  // add pot amount to bank if last player is seated
  if (seated) {
    await db
      .query("SELECT pot from tables WHERE id = $1", [tableID])
      .then(dbres => {
        tobank += dbres.rows[0].pot;
      });
  }

  // returning money to bank
  await db.query("UPDATE users SET bank=bank+$2 WHERE id=$1", [
    playerID,
    tobank
  ]);

  // delete last player and table since no players left
  await db.query("DELETE FROM user_table WHERE player_id=$1", [playerID]);
  await db.query("DELETE FROM tables WHERE id=$1", [tableID]);
  return "Success";
};

/**
 * Initiate new round at table. Add players waiting to join, shuffle deck, force blinds.
 * @param {number} tableID
 * @returns {Promise<void>}
 */
const newRound = async tableID => {
  // Add players in waiting list
  await db.query("UPDATE user_table SET seated = true WHERE table_id = $1", [
    tableID
  ]);

  // get all players at table
  const dbRes = await db.query(
    "SELECT player_id, dealer from user_table where table_id = $1 AND seated=true order by id",
    [tableID]
  );
  // all players at table
  const players = dbRes.rows;
  // console.log("players", players);

  // deck will contain 52 cards to start
  const deck = fillDeck();

  // Deal 2 cards to each player
  for (i = 0; i < players.length; i += 1) {
    const cards = "{" + deck.pop() + "," + deck.pop() + "}";
    await db.query("UPDATE user_table SET cards = $1 WHERE player_id=$2", [
      cards,
      players[i].player_id
    ]);
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
  if (currentPlayerIndex >= players.length && players.length > 2) {
    currentPlayerIndex -= players.length;
  } else if (players.length === 2) {
    currentPlayerIndex = smallBlindIndex;
  }
  const smallBlindPlayerID = players[smallBlindIndex].player_id;
  const bigBlindPlayerID = players[bigBlindIndex].player_id;
  // console.log("current player ", players[currentPlayerIndex]);
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

/**
 * Trigger this after a round is complete. Not called before first round. Cycles dealer, blinds, roundname. Sets bets to 0.
 * @param {number} userID
 * @returns {Promise<void>}
 */
const initNewRound = async (userID, emitter) => {
  // get all players at table
  let players = [];
  await db
    .query(
      "SELECT player_id, dealer from user_table where table_id = (SELECT table_id FROM user_table WHERE player_id = $1) order by id",
      [userID]
    )
    .then(res => (players = res.rows));

  if (players.length === 0) {
    return false;
  }
  // cycle dealer clockwise
  let dealerIndex = players.findIndex(player => player.dealer === true) + 1;
  if (dealerIndex >= players.length) {
    dealerIndex = 0;
  }
  const dealerID = players[dealerIndex].player_id;
  // console.log(dealerID);
  await db.query("UPDATE user_table SET dealer=true WHERE player_id=$1", [
    dealerID
  ]);
  await db.query(
    "UPDATE user_table SET dealer=false WHERE player_id!=$1 AND table_id=(SELECT table_id FROM user_table where player_id = $1)",
    [dealerID]
  );

  // set pot to 0, empty deck in tables, empty board in tables
  await db.query(
    "UPDATE tables SET pot=0, deck='{}', board='{}' WHERE id=(SELECT table_id FROM user_table WHERE player_id = $1)",
    [userID]
  );

  // set roundname to Deal
  await setRoundName("Deal", userID);

  // set all bets to 0 in user_table, set each player last action to null, talked to false, cards to empty array
  let tableID;
  await db
    .query(
      "UPDATE user_table SET bet=0, roundbet=0, lastaction=null, talked=false, cards='{}' WHERE table_id=(SELECT table_id FROM user_table WHERE player_id = $1) returning table_id",
      [userID]
    )
    .then(res => (tableID = res.rows[0].table_id));

  // call new round
  await newRound(tableID);

  // let table know that a new round has begun
  emitter
    .of("/game")
    .in(tableID)
    .emit("table updated");
};

/**
 * Progresses round from one to next
 * @param {number} userID user who took the action that triggered a round progress event
 * @return {string} returns success message
 */
const progress = async (userID, emitter) => {
  const seatedPlayers = await getGame(userID);

  const status = seatedPlayers[0].status;
  const roundname = seatedPlayers[0].roundname;
  const board = seatedPlayers[0].board;
  const tableID = seatedPlayers[0].table_id;
  // if status of game is started then progress, else null
  if (status === "started") {
    // If only one player left unfolded, then he wins the pot
    const notFolded = seatedPlayers.filter(
      player => player.lastaction !== "fold"
    );
    // only progress game if it is end of round or only one player left
    if ((await checkForEndOfRound(userID)) === true || notFolded.length === 1) {
      // if current player is last player, first player is set as current player, else move current player 1 down the table.
      const currentPlayerIndex = seatedPlayers.findIndex(
        user => user.currentplayer === true
      );
      const newCurrentPlayerIndex =
        currentPlayerIndex >= seatedPlayers.length - 1
          ? currentPlayerIndex - seatedPlayers.length + 1
          : currentPlayerIndex + 1;
      const newCurrentPlayerID = seatedPlayers[newCurrentPlayerIndex].player_id;

      await setCurrentPlayer(newCurrentPlayerID, tableID);

      //Move all bets to the pot
      await moveAllBetsToPot(userID);

      // if only one player left unfolded, then he should win the pot
      if (notFolded.length === 1) {
        await setRoundName("Showdown", userID);

        // compile check for winner and check for bankrupt into one messages object and if it exists then return it
        let endRoundMessage = {};
        endRoundMessage.winner = await checkForWinner(userID);
        endRoundMessage.bankrupt = await checkForBankrupt(userID);
        if (
          endRoundMessage.winner.length > 0 ||
          endRoundMessage.bankrupt.length > 0
        ) {
          emitter
            .of("/game")
            .in(tableID)
            .emit("round message", endRoundMessage);
          setTimeout(() => initNewRound(userID, emitter), 3000);
          return "Success";
        }
      }
      if (roundname === "River") {
        await setRoundName("Showdown", userID);
        //Evaluate each hand
        for (let j = 0; j < seatedPlayers.length; j += 1) {
          let cards = seatedPlayers[j].cards.concat(board);
          let hand = rankHand({ cards });
          await setRank(seatedPlayers[j].player_id, hand);
        }

        // compile check for winner and check for bankrupt into one messages object and if it exists then return it
        let endRoundMessage = {};
        endRoundMessage.winner = await checkForWinner(userID);
        endRoundMessage.bankrupt = await checkForBankrupt(userID);
        if (
          endRoundMessage.winner.length > 0 ||
          endRoundMessage.bankrupt.length > 0
        ) {
          emitter
            .of("/game")
            .in(tableID)
            .emit("round message", endRoundMessage);
          setTimeout(() => initNewRound(userID, emitter), 3000);
          return "Success";
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

    // let table know that a user has completed an action
    emitter
      .of("/game")
      .in(tableID)
      .emit("table updated");
    // return success message
    return "Success";
  }
};

module.exports = {
  kickLastPlayer,
  newRound,
  initNewRound,
  progress
};
