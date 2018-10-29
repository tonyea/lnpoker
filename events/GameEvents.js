const EventEmitter = require("events");

class GameEvents extends EventEmitter {
  constructor(app) {
    super();

    this.socket = app.get("socketio");
  }

  joinedGame(userID, tableID) {
    this.emit("joinedGame", { userID, tableID });
  }

  leftGame(userID, tableID) {
    this.emit("leftGame", { userID, tableID });
  }
}

const events = app => {
  const gameEvents = new GameEvents(app);

  // everyone on the table should be updated when a player joins. Also, the landing page should update it's numbers
  gameEvents.on("joinedGame", arg => {
    console.log(`${arg.userID} has joined table # ${arg.tableID}`);
    // send socket emit to all users at table that a user has joined a table
    gameEvents.socket
      .of("/game")
      .in(arg.tableID)
      .emit("table updated");
    console.log("io", "gameEvents.socket");

    // send update to landing page that table has been updated
  });

  return gameEvents;
};

module.exports = events;
