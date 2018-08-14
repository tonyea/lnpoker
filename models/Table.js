const db = require("../db");

const { performance } = require("perf_hooks");

// @params NA
// @return table if already created, else false
// @desc find the first table in the DB. This is temporary until we add ability for multiple tables
const findTable = async () => {
  const { rows } = await db.query("SELECT * FROM lnpoker.tables limit 1");

  if (rows.length < 1) {
    return false;
  }

  return rows[0];
};

// @params NA
// @return table object without players array
// @desc create a new table using default params instead of destructuring table arguments
const createNewTable = async () => {
  return await db.query("INSERT INTO lnpoker.tables DEFAULT VALUES returning *")
    .rows[0];
};

// @params tableID and userID
// @return table object with players array
// @desc create a new table using default params instead of destructuring table arguments
const joinTable = async (tableID, userID) => {
  // append user id to table | auto join the table you create
  await db.query(
    "INSERT INTO lnpoker.user_table(player_id, table_id) VALUES ($1, $2)",
    [userID, tableID]
  );
};

// @params tableID
// @return array
// @desc return array of users found on table
const getPlayersAtTable = async tableID => {
  const players = await db.query(
    "SELECT username, dealer, chips, folded, allin, talked, cards FROM lnpoker.users INNER join lnpoker.user_table on lnpoker.users.id = lnpoker.user_table.player_id WHERE lnpoker.user_table.table_id = $1",
    [tableID]
  );

  if (players.rows.length > 0) {
    return players.rows;
  }
  // else return empty array
  return [];
};

// @params tableID and userID
// @return bool
// @desc return true if user is found on table, else false
const isPlayerOnTable = async (userID, tableID) => {
  const result = await db.query(
    "SELECT username FROM lnpoker.users INNER join lnpoker.user_table on lnpoker.users.id = lnpoker.user_table.player_id WHERE lnpoker.user_table.player_id = $1 and lnpoker.user_table.table_id = $2",
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
      table = await createNewTable();

      await joinTable(table.id, userID);

      table.players = await getPlayersAtTable(table.id);

      return cb(null, table);
    }

    // return table if player is already on table
    if (await isPlayerOnTable(userID, table.id)) {
      table.players = await getPlayersAtTable(table.id);
      return cb(null, table);
    }

    // set player object to requesting user's id if above are false
    // add the user to the table
    await joinTable(table.id, userID);

    table.players = await getPlayersAtTable(table.id);
  } catch (error) {
    return cb(error);
  }
  return cb(null, table);
};

// @desc - join existing table
// @params - cb is a callback function that takes errors as it's first param, and table state as second. userID takes user id from requesting user
// returns errors or table data
const exitTable = async userID => {
  await db.query(
    "DELETE FROM lnpoker.user_table WHERE lnpoker.user_table.player_id = $1",
    [userID]
  );
};

module.exports = { joinTableIfItExists, exitTable };

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
