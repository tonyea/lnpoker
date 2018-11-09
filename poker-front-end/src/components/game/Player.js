import React, { PureComponent } from "react";
import Card from "./Card";
import axios from "axios";
import { connect } from "react-redux";
import Countdown from "./Countdown";

class Player extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      betAmount: 0
    };

    this.callGame = this.callGame.bind(this);
    this.betGame = this.betGame.bind(this);
    this.checkGame = this.checkGame.bind(this);
    this.foldGame = this.foldGame.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = e => {
    this.setState({ betAmount: e.target.value });
  };

  // Hit call post request
  callGame = async () => {
    await axios.post("/api/game/call");
  };
  // Hit check post request
  checkGame = async () => {
    await axios.post("/api/game/check");
  };
  // Hit bet post request
  betGame = async () => {
    await axios.post("/api/game/bet/" + this.state.betAmount);
  };
  // Hit fold post request
  foldGame = async () => {
    await axios.post("/api/game/fold");
  };

  render() {
    // console.log("this.props.myInfo", this.props.myInfo);
    const {
      cards,
      chips,
      dealer,
      username,
      bet,
      currentplayer,
      isSmallBlind,
      isBigBlind,
      lastaction,
      action_timestamp
    } = this.props.myInfo;

    const { disabledstate, timeout } = this.props;
    const isMaxBet = bet === this.props.maxbet;

    const renderCard = (cardInfo, cardKey) => {
      return <Card card={cardInfo} key={cardKey} />;
    };

    const cardRows = [];
    if (cards && cards.length > 0) {
      for (const key in cards) {
        const element = cards[key];
        cardRows.push(renderCard(element, key));
      }
    } else {
      return (
        <div className="row awaiting-opponents">Waiting for new round</div>
      );
    }

    let actionState = <div>Waiting</div>;
    if (currentplayer && !disabledstate) {
      actionState = <div>My Turn</div>;
    }
    if (lastaction === "fold") {
      actionState = <div>Folded</div>;
    }

    return (
      <div className="row player-row">
        {currentplayer ? (
          <Countdown date={action_timestamp} timeout={timeout} />
        ) : null}
        <div
          className={
            currentplayer && !disabledstate
              ? "col-sm-12 col-md-3 text-sm-center player-row-info order-sm-3 current-player"
              : "col-sm-12 col-md-3 text-sm-center player-row-info order-sm-3"
          }
        >
          <div className="card text-center">
            <div className="card-header">{username}</div>
            <div className="card-body">
              <h5 className="card-title">{actionState}</h5>
              <div className="tokens row mb-2">
                {dealer ? <div className="card-text tokens-d">D</div> : null}

                {isSmallBlind ? (
                  <div className="card-text tokens-sb">SB</div>
                ) : null}

                {isBigBlind ? (
                  <div className="card-text tokens-bb">BB</div>
                ) : null}
              </div>
              {bet > 0 ? <p className="card-text">Bet: {bet}</p> : null}
            </div>
            <div className="card-footer text-muted">Bal: {chips} Sats</div>
          </div>
        </div>

        <div className="btn-group-vertical btn-group-sm player-row-buttons col-sm-12 col-md-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={this.checkGame}
            disabled={!currentplayer || disabledstate || !isMaxBet}
          >
            Check
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={this.callGame}
            disabled={!currentplayer || disabledstate || isMaxBet}
          >
            Call
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={this.foldGame}
            disabled={!currentplayer || disabledstate}
          >
            Fold
          </button>
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={this.betGame}
            disabled={!currentplayer || disabledstate}
          >
            Bet
          </button>
          <div className="bet-slider">
            <input
              className="bet-slider__range"
              type="range"
              value={this.state.betAmount}
              min="0"
              max={chips}
              step="1"
              onChange={this.handleChange}
              disabled={!currentplayer || disabledstate}
            />
            <span className="bet-slider__value">
              {this.state.betAmount} Sats
            </span>
          </div>
        </div>

        <div className="col-sm-12 col-md-3 player-row-card row order-sm-2">
          {cardRows}
        </div>
      </div>
    );
  }
}

// filter out opponents info from players to get my info
const mapStateToProps = state => ({
  myInfo: state.game.players
    ? state.game.players.find(
        player => player.username === state.auth.user.username
      )
    : [],
  maxbet: state.game.players
    ? state.game.players.reduce((prev, current) =>
        prev.bet > current.bet ? prev.bet : current.bet
      )
    : 0,
  disabledstate:
    state.game.roundname === "Showdown" || state.game.roundMessage
      ? Object.keys(state.game.roundMessage).length > 0
      : false,
  timeout: state.game.timeout || 60000
});

export default connect(
  mapStateToProps,
  null
)(Player);
