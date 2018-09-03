const poker = require("./lib/node-poker");

/**
 * Initialize Socket.io
 *
 */
const init = app => {
  const http = require("http").Server(app);
  const io = require("socket.io")(http);
  // const gameEvents = require("./event_handlers/game_handler");

  app.set("socketio", io);

  let userNum = 0;
  // let activePlayers = [];
  io.of("/game").on("connection", client => {
    client.join("test room");
    userNum++;
    console.log("a user connected", userNum);
    // console.log("activePlayers when a user connects 3", activePlayers);

    // client.on("new player", (playerID, playerName) => {
    //   // if user is in array of active players then update his socket id
    //   const playerIndex = activePlayers.findIndex(
    //     activePlayer => activePlayer.playerID === playerID
    //   );
    //   // console.log(playerIndex);
    //   if (playerIndex !== -1) {
    //     activePlayers[playerIndex].socketID = client.id;
    //     console.log("activePlayers when a user connects 1", activePlayers);

    //     console.log("player already connected", activePlayers[playerIndex]);
    //     return;
    //   }
    //   // else if user is not in array of active players then add him
    //   else if (playerIndex === -1) {
    //     activePlayers.push({ socketID: client.id, playerID, playerName });
    //   }

    //   console.log("activePlayers when a user connects 2", activePlayers);
    //   // console.log("new player connected", activePlayers);
    // });

    client.on("message", handleMessage);

    client.on("disconnect", () => {
      userNum--;
      console.log("Got disconnected!", userNum);
      // // find player's socket id that matches the disconnected socket id
      // let i = activePlayers.findIndex(player => player.socketID === client.id);
      // // if found, remove that element
      // activePlayers.splice(i, 1);
      // console.log("activePlayers when a user disconnects", activePlayers);
    });
  });

  let msgs = [];
  const handleMessage = msg => {
    // console.log("message: " + msg);
    // add message to back end state
    msgs = [...msgs, msg];
    // emit all messages to chat subscribers
    io.emit("chat message", msgs);
  };

  // const handleNewPlayer = (id, name) => {
  //   // if user is not in array of active players then add him
  //   const foundPlayer = activePlayers.find(
  //     activePlayer => activePlayer.id === id
  //   );
  //   if (foundPlayer !== undefined) {
  //     return console.log("player already connected", foundPlayer);
  //   }
  //   activePlayers.push({ id, name });
  //   console.log("new player connected", activePlayers);
  // };

  // const handleDisconnect = id => {
  //   // find index of user that disconnected, remove from array and remove from DB user_table
  //   activePlayers.findIndex(index => {
  //     if (activePlayers[index].id === id) {
  //       activePlayers.splice(index, 1);
  //     }
  //   });
  //   console.log("user disconnected", activePlayers);
  //   userNum--;
  //   console.log("user disconnected", userNum);
  // };
  return http;
};

module.exports = init;
