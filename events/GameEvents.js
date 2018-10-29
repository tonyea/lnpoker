const EventEmitter = require("events");

class GameEvents extends EventEmitter {
  constructor(app) {
    super();

    this.socket = app.get("socketio");
  }

  joinedGame(userID, tableID) {
    this.emit("joinedGame", { userID, tableID });
  }
}

const events = app => {
  const gameEvents = new GameEvents(app);
  gameEvents.on("joinedGame", arg => {
    console.log(`${arg.userID} has joined table # ${arg.tableID}`);
    // send socket emit to all users at table that a user has joined a table
    // gameEvents.socket.of("/game")
    // .in(tableID)
    // .emit("table updated");
    console.log("io", gameEvents.socket);

    // send update to landing page that table has been updated
  });

  return gameEvents;
};

module.exports = events;
