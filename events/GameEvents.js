const EventEmitter = require("events");

class GameEvents extends EventEmitter {
  constructor(app) {
    super();

    this.socket = app.get("socketio");
  }

  joinedGame(userID, tableID) {
    this.emit("joined game", { userID, tableID });
  }

  leftGame(userID, tableID) {
    this.emit("left game", { userID, tableID });
  }

  gameAction(tableID) {
    this.emit("game action", { tableID });
  }

  newRound(tableID) {
    this.emit("new round", { tableID });
  }

  endRound(tableID, msg) {
    this.emit("end round", { tableID, msg });
  }

  gameover(userID, tableID) {
    this.emit("gameover", { userID, tableID });
  }
}

const events = app => {
  const gameEvents = new GameEvents(app);

  /**
   * Lets all users at a table know that a player has joined
   * @param {object} arg Object that contains userID of user that joinde and tableID of table that was joined
   * @listens joinedGame A user join event
   */
  gameEvents.on("joined game", arg => {
    console.log(`${arg.userID} has joined table # ${arg.tableID}`);
    // send socket emit to all users at table, except the user that joined, that a user has joined a table
    gameEvents.socket
      .of("/game")
      .in(arg.tableID)
      .emit("table updated");
  });

  /**
   * Lets all users at a table know that a player has taken an action
   * @param {number} tableID tableID of table where action occured
   * @listens gameAction A user game action event
   */
  gameEvents.on("game action", tableID => {
    console.log(`user action triggered`);
    // send socket emit to all users at table that a user has taken an action
    gameEvents.socket
      .of("/game")
      .in(tableID)
      .emit("table updated");
  });

  /**
   * Lets all users at a table know that a new round has begun. Not triggered for first round.
   * @param {number} tableID
   * @listens newRound A new round event
   */
  gameEvents.on("new round", tableID => {
    console.log(`new round triggered`);
    // send socket emit to all users at table that a user has taken an action
    gameEvents.socket
      .of("/game")
      .in(tableID)
      .emit("table updated");
  });

  gameEvents.on("end round", arg => {
    console.log(`end round triggered`);
    // send socket emit to all users at table that a user has taken an action
    gameEvents.socket
      .of("/game")
      .in(arg.tableID)
      .emit("round message", arg.msg);
  });

  gameEvents.on("bankrupt", arg => {
    console.log(`banktrupt triggered`);
    // send socket emit to all users at table that a user has taken an action
    gameEvents.socket
      .of("/game")
      .in(arg.tableID)
      .emit("round message", arg.msg);
  });

  gameEvents.on("gameover", arg => {
    console.log(`gameover triggered`);
    // send socket emit to all users at table that a user has taken an action
    gameEvents.socket
      .of("/game")
      .in(arg.tableID)
      .emit("gameover", arg.msg);
  });

  gameEvents.on("leftGame", arg => {
    console.log(`exit triggered`);
    // send socket emit to all users at table that a user has taken an action
    gameEvents.socket
      .of("/game")
      .in(arg.tableID)
      .emit("player exit", arg.username);
  });

  return gameEvents;
};

module.exports = events;
