const exitTable = require("./models/Table").exitTable;

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
  let activePlayers = [];
  io.of("/game").on("connection", client => {
    userNum++;
    console.log("a user connected", userNum);
    console.log("users and rooms", activePlayers);

    client.on("room", (tableid, userid) => {
      // if user is already in array of active players then update his socket id
      const playerIndex = activePlayers.findIndex(
        activePlayer => activePlayer.userid === userid
      );
      if (playerIndex !== -1) {
        activePlayers[playerIndex].socketid = client.id;
        console.log("player already connected", activePlayers[playerIndex]);
        return;
      }
      // else if user is not in array of active players then add him
      else if (playerIndex === -1) {
        activePlayers.push({ userid, tableid, socketid: client.id });
      }
      // have client join the room with his tableID
      client.join(tableid);
      console.log("a user joined room", activePlayers);
    });

    client.on("disconnect", tableid => {
      userNum--;
      console.log("Got disconnected!", userNum);

      // find player's socket id that matches the disconnected socket id
      let i = activePlayers.findIndex(player => player.socketid === client.id);

      // if found, trigger exit table and leave room
      // validate that the table is the same for that socketid
      if (i >= 0 && activePlayers[i].tableid === tableid && tableid !== null) {
        exitTable(activePlayers[i].userid, returnEmit);
        // remove that element after triggering exit table
        activePlayers.splice(i, 1);

        console.log("activePlayers when a user disconnects", activePlayers);
      }
    });

    // client.on("message", handleMessage);
  });

  const returnEmit = (errors, resultFromCaller = {}, tableID = null) => {
    if (errors) {
      return;
    }
    // emit a status update to all players at the table that the table has changed. it will also return the response as is
    if (resultFromCaller === "Success") {
      io.of("/game")
        .in(tableID)
        .emit("table updated");
    }
    // if round message received emit to table
    if (resultFromCaller.winner || resultFromCaller.bankrupt) {
      io.of("/game")
        .in(tableID)
        .emit("round message", resultFromCaller);
    }
    // trigger init new round if winner
    if (resultFromCaller.winner) {
      console.log(resultFromCaller.winner);
      setTimeout(() => {
        initNewRound(req.user.id).then(res => {
          io.of("/game")
            .in(tableID)
            .emit("table updated");
        });
      }, 3000);
    }
    // send message before kicking out last player
    if (resultFromCaller.gameover) {
      setTimeout(() => {
        io.of("/game")
          .in(tableID)
          .emit("gameover");
      }, 3000);
    }
  };

  // let msgs = [];
  // const handleMessage = msg => {
  //   // console.log("message: " + msg);
  //   // add message to back end state
  //   msgs = [...msgs, msg];
  //   // emit all messages to chat subscribers
  //   io.emit("chat message", msgs);
  // };

  return http;
};

module.exports = init;
