import React, { Component } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import {
  fetchGameData,
  setRoundMessage,
  exitGame
} from "../../actions/gameActions";
import { Prompt } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import axios from "axios";

// socket
import io from "socket.io-client";

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: io.connect("http://localhost:8010/game")
    };
  }

  async componentDidMount() {
    console.log("mounted");

    // connect socket before fetching data
    await this.state.socket.on("connect", async () => {
      // get table ID to pass to socket to put user in room
      await axios.get("/api/game/id").then(res => {
        // send user information to socket to put him in a room
        this.state.socket.emit("room", res.data, this.props.user.id);
        console.log("emitted room info", res.data, this.props.user.id);
      });
      console.log("client socket id on connect", this.state.socket.id);
    });

    // Set state of game when table is mounted
    await this.props.fetchGameData();
    // default to empty roundmessage
    this.props.setRoundMessage({});

    // set round message on winner, bankrupt etc.
    this.state.socket.on("round message", msg => {
      this.props.setRoundMessage(msg);
    });

    // notification from socket that DB has been update shoudl refresh store
    this.state.socket.on("table updated", () => {
      console.log("table updated");
      // debugger;
      this.props.fetchGameData();
      this.props.setRoundMessage({});
    });
  }

  componentWillUnmount() {
    // remove player from state when leaving table
    this.props.exitGame();
    console.log("client socket id on disconnect", this.state.socket.id);
    this.state.socket.disconnect();
  }
  render() {
    console.log("rendered");

    return (
      <div className="container table-container">
        <Prompt
          message={location =>
            `Leaving a game might lead to loss of blinds and bets placed. Are you sure?`
          }
        />
        <Opponents />

        <Board />

        <Player />
      </div>
    );
  }
}

Table.propTypes = {
  fetchGameData: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  game: state.game,
  user: {
    id: state.auth.user.id,
    name: state.auth.user.username
  }
});

const mapDispatchToProps = dispatch => ({
  setRoundMessage: msg => dispatch(setRoundMessage(msg)),
  fetchGameData: () => dispatch(fetchGameData()),
  exitGame: () => dispatch(exitGame())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Table);
