import React, { Component } from "react";
import Card from "./Card";
// import PropTypes from "prop-types";
// import io from "socket.io-client";

class Board extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    // this.socket = io("http://localhost:8000/");
  }

  // componentDidMount() {
  //   console.log("board has mounted");

  //   // listening for socket event
  //   // this.socket.on("game board", board => {
  //   //   console.log("received board data from socket", board);

  //   //   this.setState(board);
  //   //   console.log(this.state);
  //   // });
  // }

  renderCard(cardType, key) {
    return <Card card={cardType} key={key} />;
  }

  render() {
    const cardRows = [];
    for (const key in this.state) {
      const element = this.state[key];
      cardRows.push(this.renderCard(element, key));
    }

    return <div className="row deck-row"> {cardRows}</div>;
  }
}

export default Board;
