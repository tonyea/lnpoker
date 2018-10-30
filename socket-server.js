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

  io.of("/game").on("connection", client => {
    userNum++;
    // console.log("a user connected", userNum);
    // console.log("users and rooms", activePlayers);

    client.on("room", (tableid, userid) => {
      console.log("Got connected!", userNum);
      // if user is already in array of active players then update his socket id
      const playerIndex = activePlayers.findIndex(
        activePlayer => activePlayer.userid === userid
      );
      // have client join the room with his tableID
      client.join(tableid);
      if (playerIndex !== -1) {
        activePlayers[playerIndex].socketid = client.id;
        // console.log("player already connected", activePlayers[playerIndex]);
      }
      // else if user is not in array of active players then add him
      else if (playerIndex === -1) {
        activePlayers.push({
          userid,
          tableid,
          socketid: client.id
        });
      }

      console.log("activePlayers when a user connects", activePlayers);
    });

    client.on("disconnect", tableid => {
      userNum--;
      console.log("Got disconnected!", userNum);

      // find player's socket id that matches the disconnected socket id
      let i = activePlayers.findIndex(player => player.socketid === client.id);

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
