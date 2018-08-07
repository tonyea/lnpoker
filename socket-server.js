const poker = require("./lib/node-poker");

/**
 * Initialize Socket.io
 *
 */
const init = app => {
  const http = require("http").Server(app);
  const io = require("socket.io")(http);
  // const gameEvents = require("./event_handlers/game_handler");

  io.on("connection", client => {
    console.log("a user connected");

    client.on("message", handleMessage);

    client.on("new game", newGame);

    client.on("disconnect", () => console.log("user disconnected"));
  });

  let msgs = [];
  const handleMessage = msg => {
    // console.log("message: " + msg);
    // add message to back end state
    msgs = [...msgs, msg];
    // emit all messages to chat subscribers
    io.emit("chat message", msgs);
  };

  const newGame = () => {
    const table = new poker.Table(50, 100, 4, 10, 100, 1000);

    table.AddPlayer("bob", 1000);
    table.AddPlayer("jane", 1000);
    table.AddPlayer("dylan", 1000);
    table.AddPlayer("john", 1000);

    table.StartGame();

    // console.log(table.game);
    io.emit("game", table.game);

    // sending deck of 5 to board
    io.emit("game board", table.game.deck.slice(0, 5));
  };

  return http;
};

module.exports = init;
