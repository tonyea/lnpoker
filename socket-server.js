/**
 * Initialize Socket.io
 *
 */
const init = app => {
  const http = require("http").Server(app);
  const io = require("socket.io")(http);

  app.set("socketio", io);

  let userNum = 0;
  let activePlayers = [];

  io.of("/game").on("connection", clientSocket => {
    userNum++;
    // console.log("a user connected", userNum);
    // console.log("users and rooms", activePlayers);

    clientSocket.on("test", () => {
      console.log("test");
      console.log("Test listener - Rooms listed: ", clientSocket.adapter.rooms);
    });

    clientSocket.on("room", (tableid, userid) => {
      console.log(userid, " got connected!", userNum);
      // if user is already in array of active players then update his socket id
      const playerIndex = activePlayers.findIndex(
        activePlayer => activePlayer.userid === userid
      );
      // have clientSocket join the room with his tableID
      clientSocket.join(tableid);
      console.log("Rooms listed: ", clientSocket.adapter.rooms);

      if (playerIndex !== -1) {
        activePlayers[playerIndex].socketid = clientSocket.id;
        // console.log("player already connected", activePlayers[playerIndex]);
      }
      // else if user is not in array of active players then add him
      else if (playerIndex === -1) {
        activePlayers.push({
          userid,
          tableid,
          socketid: clientSocket.id
        });
      }

      console.log("activePlayers when a user connects", activePlayers);
    });

    clientSocket.on("disconnect", () => {
      userNum--;
      console.log("Got disconnected!", userNum);

      // find player's socket id that matches the disconnected socket id
      let i = activePlayers.findIndex(
        player => player.socketid === clientSocket.id
      );

      // if found, trigger exit table and leave room
      // validate that the table is the same for that socketid
      if (i >= 0 && activePlayers[i].tableid !== null) {
        // remove player from active array
        activePlayers.splice(i, 1);

        console.log("activePlayers when a user disconnects", activePlayers);
      }
    });
  });

  return http;
};

module.exports = init;
