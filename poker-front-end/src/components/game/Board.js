import React, { Component } from "react";
import Card from "./Card";

class Board extends Component {
  constructor(props) {
    super(props);

    this.state = {
      card1: "2D",
      card2: "3D",
      card3: "4D",
      card4: "5D",
      card5: "6D"
    };
  }

  renderCard(cardType) {
    return <Card card={cardType} />;
  }
  render() {
    return (
      <div className="row deck-row">
        {this.renderCard(this.state.card1)}
        {this.renderCard(this.state.card2)}
        {this.renderCard(this.state.card3)}
        {this.renderCard(this.state.card4)}
        {this.renderCard(this.state.card5)}
      </div>
    );
  }
}

export default Board;
