import React from "react";
import Opponent from "./Opponent";
import { connect } from "react-redux";
import PropTypes from "prop-types";

const Opponents = props => {
  const renderOpponent = (playerInfo, playerKey) => {
    return (
      <Opponent
        playerInfo={playerInfo}
        key={playerKey}
        disabledstate={disabledstate}
      />
    );
  };
  const { opponents, disabledstate } = props;

  const playerRows = [];
  if (opponents.length > 0) {
    for (const key in opponents) {
      const element = opponents[key];
      playerRows.push(renderOpponent(element, key));
    }
  } else {
    return <div>No Players have joined</div>;
  }

  return (
    <div className="row opponents-row">
      <div className="opponents-row-title">Players</div>
      {playerRows}
    </div>
  );
};

Opponents.propTypes = {
  opponents: PropTypes.arrayOf(
    PropTypes.shape({
      username: PropTypes.string.isRequired,
      chips: PropTypes.number.isRequired
    }).isRequired
  ).isRequired
};

const mapStateToProps = state => ({
  opponents: state.game.players
    ? state.game.players.filter(
        player => player.username !== state.auth.user.username
      )
    : [],
  disabledstate: state.roundname === "Showdown" // || state.roundmessage.winner || state.roundmessage.bankrupt
});

export default connect(
  mapStateToProps,
  null
)(Opponents);
