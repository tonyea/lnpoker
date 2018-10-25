import React, { Component } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import * as actions from "../../actions/gameActions";
import { getIsFetching } from "../../reducers";
import { Prompt } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";

// socket
import io from "socket.io-client";

class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: io("http://localhost:8010/game"),
      roundmessage: {}
    };
  }

  async componentDidMount() {
    // Set state of game when table is mounted
    console.log("mounted");
    await this.props.fetchGameData();

    this.state.socket.on("connect", () => {
      this.state.socket.emit("room", this.props.game.id, this.props.user.id);
      console.log("emitted room info", this.props.game.id, this.props.user.id);
      console.log("client socket id on connect", this.state.socket.id);
    });

    // this.state.socket.on("round message", msg =>
    //   this.setState({ roundmessage: msg })
    // );

    this.state.socket.on("table updated", () => {
      console.log("table updated");
      this.props.fetchGameData();
      // this.setState({ roundmessage: {} });
    });
  }

  componentWillUnmount() {
    // remove player from state when leaving table
    // this.props.exitGame();
    console.log("client socket id on disconnect", this.state.socket.id);
    this.state.socket.disconnect(this.props.game.id);
  }
  render() {
    console.log("rendered");

    // const { isFetching, smallblind } = this.props.game;

    // // // loading indicator
    // if (isFetching || !smallblind) {
    //   return <p> Loading </p>;
    // }

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
  fetchGameData: PropTypes.func.isRequired
  // user: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  game: state.game,
  // isFetching: getIsFetching(state),
  user: {
    id: state.auth.user.id,
    name: state.auth.user.username
  }
});

export default connect(
  mapStateToProps,
  actions
)(Table);
