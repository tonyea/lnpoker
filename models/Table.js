const db = require("../db");

// @params NA
// @return table if already created, else false
// @desc find the first table in the DB. This is temporary until we add ability for multiple tables
const findTable = async () => {
  const { rows } = await db.query(
    "SELECT id, smallblind, bigblind, minplayers, maxplayers, minbuyin, maxbuyin, pot, roundname, betname, board, status FROM tables limit 1"
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
    "INSERT INTO tables DEFAULT VALUES returning id, smallblind, bigblind, minplayers, maxplayers, minbuyin, maxbuyin, pot, roundname, betname, board, status "
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

// @params tableID, userID
// @return array
// @desc return array of users found on table
const getPlayersAtTable = async (tableID, userID) => {
  const players = await db.query(
    `
    SELECT username, dealer, chips, talked, lastaction, bet, currentplayer, null as cards
    FROM users 
    INNER join user_table on users.id = user_table.player_id
    WHERE user_table.table_id=$1 and player_id!=$2
    union
    SELECT username, dealer, chips, talked, lastaction, bet, currentplayer, cards 
    FROM users 
    INNER join user_table on users.id = user_table.player_id
    WHERE user_table.table_id=$1 and player_id=$2`,
    [tableID, userID]
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
  await db.query("DELETE FROM user_table WHERE user_table.player_id = $1", [
    userID
  ]);
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
const initNewRound = tableID => {
  // cycle dealer clockwise
  let i;
  this.dealer += 1;
  if (this.dealer >= this.players.length) {
    this.dealer = 0;
  }
  // set pot to 0,
  this.game.pot = 0;
  this.game.roundName = "Deal"; //Start the first round
  this.game.betName = "bet"; //bet,raise,re-raise,cap
  this.game.bets.splice(0, this.game.bets.length);
  this.game.deck.splice(0, this.game.deck.length);
  this.game.board.splice(0, this.game.board.length);
  for (i = 0; i < this.players.length; i += 1) {
    this.players[i].folded = false;
    this.players[i].talked = false;
    this.players[i].allIn = false;
    this.players[i].cards.splice(0, this.players[i].cards.length);
  }
  fillDeck(this.game.deck);
  this.NewRound();
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
      return cb(null, "Success");
    }
    errors.notupdated = "Did not update action and talked state";
    return cb(errors, null);

    //Attemp to progress the game
    // progress(this.table);
  } catch (e) {
    errors.notallowed = "Check not allowed, replay please";
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
      return cb(null, "Success");
    }
    errors.notupdated = "Did not update action and talked state";
    return cb(errors, null);

    //Attemp to progress the game
    // progress(this.table);
  } catch (e) {
    errors.notallowed = "Check not allowed, replay please";
    return cb(errors, null);
  }
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

module.exports = { joinTableIfItExists, exitTable, check, fold };

// START GAME, TABLE STATE: Table {
//   smallBlind: 50,
//   bigBlind: 100,
//   minPlayers: 4,
//   maxPlayers: 10,
//   players:
//    [ Player {
//        playerName: 'bob',
//        chips: 1000,
//        folded: false,
//        allIn: false,
//        talked: false,
//        table: [Circular],
//        cards: [Array] },
//      Player {
//        playerName: 'jane',
//        chips: 950,
//        folded: false,
//        allIn: false,
//        talked: false,
//        table: [Circular],
//        cards: [Array] },
//      Player {
//        playerName: 'dylan',
//        chips: 900,
//        folded: false,
//        allIn: false,
//        talked: false,
//        table: [Circular],
//        cards: [Array] },
//      Player {
//        playerName: 'john',
//        chips: 1000,
//        folded: false,
//        allIn: false,
//        talked: false,
//        table: [Circular],
//        cards: [Array] } ],
//   dealer: 0,
//   minBuyIn: 100,
//   maxBuyIn: 1000,
//   playersToRemove: [],
//   playersToAdd: [],
//   eventEmitter:
//    EventEmitter {
//      domain: null,
//      _events: {},
//      _eventsCount: 0,
//      _maxListeners: undefined },
//   turnBet: {},
//   gameWinners: [],
//   gameLosers: [],
//   game:
//    Game {
//      smallBlind: 50,
//      bigBlind: 100,
//      pot: 0,
//      roundName: 'Deal',
//      betName: 'bet',
//      bets: [ 0, 50, 100, 0 ],
//      roundBets: [ 0, 0, 0, 0 ],
//      deck:
//       [ 'KS',
//         'KH',
//         'QD',
//         '9S',
//         '2S',
//         '5D',
//         '4D',
//         'QS',
//         '2H',
//         '9C',
//         'AH',
//         'QC',
//         '5S',
//         '6S',
//         'TH',
//         'TC',
//         '5H',
//         '3C',
//         '3H',
//         '6C',
//         'TD',
//         'JC',
//         '4S',
//         '8H',
//         '4H',
//         '9D',
//         '4C',
//         'KD',
//         '3D',
//         '5C',
//         '2C',
//         'AC',
//         '9H',
//         '7S',
//         '8D',
//         'TS',
//         'JH',
//         'KC',
//         '3S',
//         '8S',
//         '6H',
//         'AD',
//         'JD',
//         'AS' ],
//      board: [] },
//   currentPlayer: 3 }
