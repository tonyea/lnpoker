import React, { Component } from "react";
import Opponent from "./Opponent";

class Opponents extends Component {
  renderOpponent(playerInfo, playerKey) {
    return <Opponent playerInfo={playerInfo} key={playerKey} />;
  }
  render() {
    const { players } = this.props;

    const playerRows = [];
    if (players.length > 0) {
      for (const key in players) {
        const element = players[key];
        playerRows.push(this.renderOpponent(element, key));
      }
    } else {
      return <div>No Players have joined</div>;
    }

    console.log(this.props.players);
    return <div className="row opponents-row">{playerRows}</div>;
  }
}

export default Opponents;
