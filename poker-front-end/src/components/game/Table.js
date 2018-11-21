import React, { Component } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import { withRouter } from "react-router-dom";
import {
  fetchGameData,
  setRoundMessage,
  receiveGameData,
  exitGame
} from "../../actions/gameActions";
import { Prompt } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { getBankFromDB } from "../../actions/authActions";

// socket
import io from "socket.io-client";
import axios from "axios";

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: null,
      gameover: false
    };
  }

  _isMounted = false;

  async componentDidMount() {
    this._isMounted = true;
    this.setState({ socket: io("http://localhost:8010/game") });
    // console.log("mounted");

    // get table ID to pass to socket to put user in room
    // this.state.socket.on("connect", async () => {
    await axios.get("/api/game/id").then(res => {
      // send user information to socket to put him in a room
      this.state.socket.emit("room", res.data, this.props.user.id);
      // Set state of game when table is mounted
      // console.log("40: emitted room info", res.data, this.props.user.id);
    });
    // console.log("50: client socket id on connect", this.state.socket.id);
    // });

    await this.props.fetchGameData();

    this.state.socket.on("round message", msg => {
      this.props.setRoundMessage(msg);
      if (msg.bankrupt && msg.bankrupt.length > 0) {
        const amIBankrupt = msg.bankrupt.findIndex(
          bankrupt => bankrupt.playerName === this.props.user.name
        );
        // return to home if bankrupt
        if (amIBankrupt >= 0) {
          this.setState({ gameover: true });
          setTimeout(async () => {
            this.props.history.push("/");
            await this.props.exitGame();
            await this.props.getBankFromDB();
            this.state.socket.disconnect();
          }, 3000);
        }
      }
    });

    this.state.socket.on("gameover", () => {
      this.setState({ gameover: true });
      // this.props.setRoundMessage({});
      this.props.clearGameState({});
      this.props.getBankFromDB();
      this.props.history.push("/");
      this.state.socket.disconnect();
    });

    this.state.socket.on("table updated", () => {
      if (this._isMounted) {
        // console.log("table updated");
        this.props.fetchGameData();
      }
    });
  }

  async componentWillUnmount() {
    this._isMounted = false;
    // console.log("table unmounting");
    // remove player from state when leaving table
    if (!this.state.gameover) {
      await this.props.exitGame();
      await this.props.getBankFromDB();
      this.state.socket.disconnect();
    }
  }

  render() {
    // console.log("rendered");

    return (
      <div className="container table-container">
        <Prompt
          when={!this.state.gameover}
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
  user: {
    id: state.auth.user.id,
    name: state.auth.user.username
  }
});

const mapDispatchToProps = dispatch => ({
  setRoundMessage: msg => dispatch(setRoundMessage(msg)),
  fetchGameData: () => dispatch(fetchGameData()),
  exitGame: () => dispatch(exitGame()),
  clearGameState: () => dispatch(receiveGameData({})),
  getBankFromDB: () => dispatch(getBankFromDB())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Table));
