import React, { PureComponent } from "react";
import Board from "./Board";
import Opponents from "./Opponents";
import Player from "./Player";
import { connect } from "react-redux";
import * as actions from "../../actions/gameActions";
import { getIsFetching } from "../../reducers";
import PropTypes from "prop-types";

// socket
import io from "socket.io-client";

class Table extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      socket: io("http://localhost:8010/game"),
      roundmessage: {}
    };
  }

  componentDidMount() {
    // Set state of game when table is mounted
    console.log("mounted");
    this.props.fetchGameData();

    this.state.socket.on("connect", () => {
      this.state.socket.emit("room", "testroom");
      console.log("emitted room info");
    });

    this.state.socket.on("round message", msg =>
      this.setState({ roundmessage: msg })
    );

    this.state.socket.on("table updated", () => {
      console.log("table updated");
      this.props.fetchGameData();
      this.setState({ roundmessage: {} });
    });
  }

  componentWillUnmount() {
    // remove player from state when leaving table
    // this.props.exitGame();
  }
  render() {
    console.log("rendered");

    const { user, errors } = this.props;
    const { players, isFetching, roundname, ...rest } = this.props.game;

    // display error
    if (errors && errors.players) {
      return <p> {errors.players}</p>;
    }
    // bool to decide whether to show buttons
    const disabledstate =
      roundname === "Showdown" ||
      this.state.roundmessage.winner ||
      this.state.roundmessage.bankrupt;

    // loading indicator
    if (isFetching || !rest.smallblind) {
      return <p> Loading </p>;
    }

    // filter out my info from players to get opponents info
    const opponents = players.filter(player => player.username !== user.name);
    // filter out opponents info from players to get my info
    const myInfo = players.find(player => player.username === user.name);

    return (
      <div className="container table-container">
        <Opponents opponents={opponents} disabledstate={disabledstate} />

        <Board {...rest} roundMessage={this.state.roundmessage} />

        <Player myInfo={myInfo} disabledstate={disabledstate} />
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
  isFetching: getIsFetching(state),
  user: {
    id: state.auth.user.id,
    name: state.auth.user.username
  },
  errors: state.errors
});

export default connect(
  mapStateToProps,
  actions
)(Table);
