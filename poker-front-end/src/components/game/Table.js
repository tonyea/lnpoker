import React, { Component } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import History from "./History";
import Chat from "../chat/Chat";
import { connect } from "react-redux";
import * as actions from "../../actions/gameActions";
import { getIsFetching } from "../../reducers";
import PropTypes from "prop-types";

// socket
import io from "socket.io-client";

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: io("http://localhost:8010/")
    };
  }

  componentDidMount() {
    // Set state of game when table is mounted
    this.props.fetchGameData();
  }

  componentWillUnmount() {
    // remove player from state when leaving table
    this.props.exitGame();
  }
  render() {
    const { chatLog, receiveMessages, user } = this.props;
    const { players, isFetching, ...rest } = this.props.game;

    // loading indicator
    if (isFetching && players === undefined) {
      return <p> Loading </p>;
    }

    const myInfo = players
      ? players.find(player => player.username === user.name)
      : [];

    this.state.socket.on("chat message", msgs => {
      receiveMessages(msgs);
    });

    return (
      <div className="container table-container">
        <Opponents players={players || []} />

        <Board />

        <Player myInfo={myInfo} />

        <Chat socket={this.state.socket} chatLog={chatLog} />

        <History {...rest} />
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
  ).isRequired,
  receiveMessages: PropTypes.func.isRequired,
  fetchGameData: PropTypes.func.isRequired,
  exitGame: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  game: state.game,
  isFetching: getIsFetching(state),
  chatLog: state.chat,
  user: {
    id: state.auth.user.id,
    name: state.auth.user.username
  }
});

export default connect(
  mapStateToProps,
  actions
)(Table);
