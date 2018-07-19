import React, { Component } from "react";

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

class Card extends Component {
  render() {
    return <div className="col-sm">One of 5 cards</div>;
  }
}

class Deck extends Component {
  renderCard(i) {
    return <Card />;
  }
  render() {
    return (
      <div className="row deck-row">
        {this.renderCard(0)}
        {this.renderCard(1)}
        {this.renderCard(2)}
        {this.renderCard(3)}
        {this.renderCard(4)}
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

        <Deck />

        <Player />
      </div>
    );
  }
}

export default Table;
