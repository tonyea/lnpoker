var poker = require("./node-poker");

var table = new poker.Table(50, 100, 4, 10, 100, 1000);

table.AddPlayer("bob", 1000);
table.AddPlayer("jane", 1000);
table.AddPlayer("dylan", 1000);
table.AddPlayer("john", 1000);

table.StartGame();
console.log("START GAME, TABLE STATE:", table);
console.log("START GAME, GAME STATE:", table.game);

table.players[1].Call();
table.players[2].Call();
table.players[3].Call();
table.players[0].Call();
table.players[1].Call();
table.players[2].Call();
table.players[3].Call();
table.players[0].Call();
table.players[1].Bet(50);
table.players[2].Bet(1);
console.log("PLAYER 1 MID ROUND:", table.players[1]);
console.log("PLAYER 2 MID ROUND:", table.players[2]);
table.players[3].Call();
table.players[0].Call();
table.players[1].Call();
table.players[2].Call();
table.players[3].Call();
table.players[0].Call();

console.log("MID GAME, GAME STATE:", table.game);

//table.initNewRound()
