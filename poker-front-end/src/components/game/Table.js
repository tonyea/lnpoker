import React, { Component } from "react";
import Board from "./Board";
import Chat from "../chat/Chat";
import { connect } from "react-redux";
// socket
import io from "socket.io-client";
import { getNewGameData } from "../../actions/gameActions";

const Opponent = () => <div className="col-sm">One of 5 bots</div>;

// // class Opponent extends Component {
// //   render() {
// //     return <div className="col-sm">One of 5 bots</div>;
// //   }
// }

class Opponents extends Component {
  renderOpponent(i) {
    return <Opponent />;
  }
  render() {
    return (
      <div className="row opponents-row">
        {this.renderOpponent(0)}
        {this.renderOpponent(1)}
        {this.renderOpponent(2)}
        {this.renderOpponent(3)}
        {this.renderOpponent(4)}
      </div>
    );
  }
}

class Player extends Component {
  render() {
    return (
      <div className="row player-row">
        <div className="col-sm">Player Info</div>
        <div className="col-sm">Player Cards</div>
        <div className="col-sm">Pot Info</div>
        <div className="col-sm">Game Info</div>
      </div>
    );
  }
}

class Table extends Component {
  constructor(props) {
    super(props);

    this.socket = io("http://localhost:8000/");
    this.generateNewGame = this.generateNewGame.bind(this);
  }

  componentDidMount() {
    console.log("table has mounted");
    this.generateNewGame();

    const { setGame } = this.props;
    // listening for socket event
    this.socket.on("game", game => {
      console.log("received game data from socket", game);
      // console.log("setGame", setGame);
      setGame(game);
    });
  }

  generateNewGame = () => {
    this.socket.emit("new game");
    console.log("sent message to socket to start a new game");
  };

  render() {
    // console.log("deck", deck);
    // let board = {};
    // if (deck) {
    //   // console.log(deck);
    //   board.card0 = deck[0];
    //   // card1: board[1],
    //   // card2: board[2],
    //   // card3: board[3],
    //   // card4: board[4]
    // }

    return (
      <div className="container table-container">
        <Opponents />

        <Board />

        <Player />

        <Chat />
      </div>
    );
  }
}

// Chat.propTypes = {
//   // game: PropTypes.arrayOf(
//   //   PropTypes.shape({
//   //     message: PropTypes.string.isRequired,
//   //     author: PropTypes.string.isRequired,
//   //     sendDate: PropTypes.number.isRequired
//   //   }).isRequired
//   // ),
// };

const mapStateToProps = state => ({
  game: state.game,
  deck: state.game.deck
});

const mapDispatchToProps = dispatch => ({
  setGame: payload => dispatch(getNewGameData(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Table);
