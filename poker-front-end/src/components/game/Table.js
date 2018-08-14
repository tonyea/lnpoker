import React, { Component } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import Chat from "../chat/Chat";
import { connect } from "react-redux";
import { getGame } from "../../actions/gameActions";

class Table extends Component {
  componentDidMount() {
    // Set state of game when table is mounted
    console.log("table has mounted");

    this.props.getGame();
  }
  render() {
    return (
      <div className="container table-container">
        <Opponents players={this.props.players || []} />

        <Board />

        <Player />

        <Chat />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  // game: state.game,
  players: state.game.players
});

export default connect(
  mapStateToProps,
  { getGame }
)(Table);
