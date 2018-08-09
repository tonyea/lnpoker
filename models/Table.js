const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema
const TableSchema = new Schema({
  smallBlind: {
    type: Number,
    default: 1000
  },
  bigBlind: {
    type: Number,
    default: 2000
  },
  minPlayers: {
    type: Number,
    default: 2
  },
  maxPlayers: {
    type: Number,
    default: 5
  },
  minBuyIn: {
    type: Number,
    default: 100000 // min buy in 100k sats
  },
  maxBuyIn: {
    type: Number,
    default: 100000000 // max buy in 1 BTC = 100m Sats
  },
  players: [
    {
      user: {
        type: Schema.Types.ObjectId, // players is an array of User objects, importing schema
        ref: "users"
      },
      chips: { type: Number, default: 1000 },
      folded: { type: Boolean, default: false },
      allIn: { type: Boolean, default: false },
      talked: { type: Boolean, default: false },
      cards: [String] // cards held by player
    }
  ],
  dealerPosition: {
    // represents index in players array of user who is currently dealer
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = Table = mongoose.model("tables", TableSchema);

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
