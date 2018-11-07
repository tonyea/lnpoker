// include env variables
require("dotenv").config();

/**
 * Initialize Socket.io
 *
 */
const init = app => {
  const httpServer = require("http").Server(app);
  const io = require("socket.io")(httpServer);

  const sock_port = process.env.SOCKET_PORT || 8010; // Set socket port
  if (process.env.NODE_ENV !== "test") {
    httpServer.listen(sock_port, () =>
      console.log(`Socket listening on port ${sock_port}!`)
    );
  }

  // socket is made available to other parts of the app
  app.set("socketio", io);

  let activePlayers = [];

  io.of("/game").on("connection", clientSocket => {
    // console.log("users and rooms", activePlayers);

    clientSocket.on("room", (tableid, userid) => {
      // if user is already in array of active players then update his socket id
      const playerIndex = activePlayers.findIndex(
        activePlayer => activePlayer.userid === userid
      );
      // have clientSocket join the room with his tableID
      clientSocket.join(tableid);
      console.log("20: Rooms listed: ", clientSocket.adapter.rooms);

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
        console.log(
          `30: Player ${userid} got connected! ${
            activePlayers.length
          } players on table`
        );
      }

      console.log("activePlayers when a user connects", activePlayers);
    });

    clientSocket.on("disconnect", () => {
      // find player's socket id that matches the disconnected socket id
      let i = activePlayers.findIndex(player => {
        // console.log(
        //   `player.socketid, ${player.socketid} vs clientSocket.id, ${
        //     clientSocket.id
        //   }. TEST ${player.socketid === clientSocket.id}`
        // );
        return player.socketid === clientSocket.id;
      });
      // if found, trigger exit table and leave room
      // validate that the table is the same for that socketid
      if (i >= 0 && activePlayers[i].tableid !== null) {
        console.log(
          `Player ${
            activePlayers[i].userid
          } got disconnected! ${activePlayers.length - 1} players remain`
        );
        clientSocket.leave(activePlayers[i].tableid);
        // remove player from active array
        activePlayers.splice(i, 1);
      }
      console.log("activePlayers when a user disconnects", activePlayers);
    });

    clientSocket.on("subscribeToTimer", interval => {
      console.log("client is subscribing to timer with interval, ", interval);
      setInterval(() => {
        clientSocket.emit("timer", new Date());
      }, interval);
    });
  });
};

module.exports = init;
