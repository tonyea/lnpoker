const poker = require("./lib/node-poker");

/**
 * Initialize Socket.io
 *
 */
const init = app => {
  const http = require("http").Server(app);
  const io = require("socket.io")(http);
  // const gameEvents = require("./event_handlers/game_handler");

  let activePlayers = [];
  let userNum = 0;
  io.on("connection", client => {
    userNum++;
    console.log("a user connected", userNum);

    client.on("new player", handleNewPlayer);

    client.on("message", handleMessage);

    client.on("disconnect", handleDisconnect);
  });

  let msgs = [];
  const handleMessage = msg => {
    // console.log("message: " + msg);
    // add message to back end state
    msgs = [...msgs, msg];
    // emit all messages to chat subscribers
    io.emit("chat message", msgs);
  };

  const handleNewPlayer = (id, name) => {
    activePlayers.push({ id, name });

    console.log("a user connected", activePlayers);
  };

  const handleDisconnect = id => {
    // find index of user that disconnected, remove from array and remove from DB user_table
    // activePlayers.findIndex(index => {
    //   if (activePlayers[index].id === id) {
    //     activePlayers.splice(index, 1);
    //   }
    // });
    // console.log("user disconnected", activePlayers);
    userNum--;
    console.log("user disconnected", userNum);
  };
  return http;
};

module.exports = init;
