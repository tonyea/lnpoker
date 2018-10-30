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

  gameAction(tableID) {
    this.emit("gameAction", { tableID });
  }

  winner(userID, tableID) {
    this.emit("winner", { userID, tableID });
  }

  bankrupt(userID, tableID) {
    this.emit("bankrupt", { userID, tableID });
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
  gameEvents.on("joinedGame", arg => {
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
  gameEvents.on("gameAction", tableID => {
    console.log(`user action triggered`);
    // send socket emit to all users at table that a user has taken an action
    gameEvents.socket
      .of("/game")
      .in(tableID)
      .emit("table updated");
  });

  gameEvents.on("winner", arg => {
    console.log(`winner triggered`);
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
