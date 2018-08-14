import React, { Component } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import History from "./History";
import Chat from "../chat/Chat";
import { connect } from "react-redux";
import { getGame, exitGame } from "../../actions/gameActions";
import PropTypes from "prop-types";
import { receiveMessages } from "../../actions/chatActions";

// socket
import io from "socket.io-client";

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: io("http://localhost:8000/")
    };
  }

  componentDidMount() {
    // Set state of game when table is mounted
    this.props.getGame();
  }

  componentWillUnmount() {
    // remove player from state when leaving table
    this.props.exitGame();
  }
  render() {
    const { chatLog, receiveMessages, players } = this.props;

    // show newly broadcast chat messages
    this.state.socket.on("chat message", msgs => {
      receiveMessages(msgs);
    });

    return (
      <div className="container table-container">
        <Opponents players={players || []} />

        <Board />

        <Player />

        <Chat socket={this.state.socket} chatLog={chatLog} />

        <History />
      </div>
    );
  }
}

Table.propTypes = {
  chatLog: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      sendDate: PropTypes.number.isRequired
    }).isRequired
  ),
  players: PropTypes.arrayOf(
    PropTypes.shape({
      username: PropTypes.string.isRequired,
      chips: PropTypes.number.isRequired
    }).isRequired
  ),
  receiveMessages: PropTypes.func.isRequired,
  getGame: PropTypes.func.isRequired,
  exitGame: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  players: state.game.players,
  chatLog: state.chat
});

const mapDispatchToProps = dispatch => ({
  getGame: () => dispatch(getGame()),
  exitGame: () => dispatch(exitGame()),
  receiveMessages: msgs => dispatch(receiveMessages(msgs))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Table);
