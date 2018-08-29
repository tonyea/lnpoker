import React from "react";
import Opponent from "./Opponent";
import PropTypes from "prop-types";

const Opponents = props => {
  const renderOpponent = (playerInfo, playerKey) => {
    return <Opponent playerInfo={playerInfo} key={playerKey} />;
  };
  const { opponents } = props;

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

export default Opponents;
