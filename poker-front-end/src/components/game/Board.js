import React from "react";
import Card from "./Card";
import { connect } from "react-redux";
import PropTypes from "prop-types";

const Board = props => {
  const renderCard = (cardType, key) => {
    return <Card card={cardType} key={key} className="col-sm" />;
  };

  const { id, smallblind, bigblind, pot, board, roundMessage } = props;
  const cardRows = [];
  for (const key in board) {
    const element = board[key];
    cardRows.push(renderCard(element, key));
  }

  const renderMessage = (message, key) => {
    return <h3 key={key}>{message}</h3>;
  };

  const messageRows = [];
  if (roundMessage.winner && roundMessage.winner.length === 1) {
    for (const key in roundMessage.winner) {
      const winner = roundMessage.winner[key];
      messageRows.push(
        renderMessage(winner.playerName + " wins the pot", messageRows.length)
      );
    }
  }
  if (roundMessage.winner && roundMessage.winner.length > 1) {
    let winnerNames = [];
    for (const key in roundMessage.winner) {
      winnerNames.push(roundMessage.winner[key].playerName);
    }
    messageRows.push(
      renderMessage(winnerNames.join(", ") + " win the pot", messageRows.length)
    );
  }
  if (roundMessage.bankrupt && roundMessage.bankrupt.length === 1) {
    for (const key in roundMessage.bankrupt) {
      const bankrupt = roundMessage.bankrupt[key];
      messageRows.push(
        renderMessage(bankrupt.playerName + " is bankrupt", messageRows.length)
      );
    }
  }
  if (roundMessage.bankrupt && roundMessage.bankrupt.length > 1) {
    let bankruptNames = [];
    for (const key in roundMessage.bankrupt) {
      bankruptNames.push(roundMessage.bankrupt[key].playerName);
    }
    messageRows.push(
      renderMessage(
        bankruptNames.join(",") + " are bankrupt",
        messageRows.length
      )
    );
  }

  return (
    <div className="row deck-row">
      <div className="deck-row-title p-2">
        Game # {id}
        <div>Pot: {pot} Sats</div>
        <div>Small Blind: {smallblind} Sats</div>
        <div>Big Blind: {bigblind} Sats</div>
      </div>
      {messageRows.length === 0 ? (
        <div className="deck-row-cards row">{cardRows}</div>
      ) : (
        <div className="deck-row-message p-2">{messageRows}</div>
      )}
    </div>
  );
};

Board.propTypes = {
  id: PropTypes.string.isRequired,
  smallblind: PropTypes.number.isRequired,
  bigblind: PropTypes.number.isRequired,
  pot: PropTypes.number.isRequired,
  board: PropTypes.array.isRequired
};

const mapStateToProps = state => ({
  id: state.game.id,
  smallblind: state.game.smallblind,
  bigblind: state.game.bigblind,
  pot: state.game.pot,
  board: state.game.board,
  roundMessage: {} //state.game.roundmessage
});

export default connect(
  mapStateToProps,
  null
)(Board);
