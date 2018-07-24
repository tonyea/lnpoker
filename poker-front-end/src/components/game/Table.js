import React, { Component } from "react";
import Board from "./Board";
import Chat from "./chat/Chat";

class Opponent extends Component {
  render() {
    return <div className="col-sm">One of 5 bots</div>;
  }
}

class Opponents extends Component {
  renderOpponent(i) {
    return <Opponent />;
  }
  render() {
    return (
      <div className="row opponents-row">
        {this.renderOpponent(0)}
        {this.renderOpponent(1)}
        {this.renderOpponent(2)}
        {this.renderOpponent(3)}
        {this.renderOpponent(4)}
      </div>
    );
  }
}

class Player extends Component {
  render() {
    return (
      <div className="row player-row">
        <div className="col-sm">Player Info</div>
        <div className="col-sm">Player Cards</div>
        <div className="col-sm">Pot Info</div>
        <div className="col-sm">Game Info</div>
      </div>
    );
  }
}

class Table extends Component {
  render() {
    return (
      <div className="container table-container">
        <Opponents />

        <Board />

        <Player />

        <Chat />
      </div>
    );
  }
}

export default Table;
