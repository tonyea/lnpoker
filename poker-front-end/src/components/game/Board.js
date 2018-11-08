import React from "react";
import Card from "./Card";
import { connect } from "react-redux";

const Board = props => {
  const renderCard = (cardType, key) => {
    return <Card card={cardType} key={key} className="col-sm" />;
  };

  const { pot, bets, board, roundMessage } = props;
  // console.log("roundMessage", roundMessage);
  const cardRows = [];
  for (const key in board) {
    const element = board[key];
    cardRows.push(renderCard(element, key));
  }

  const renderMessage = (message, key) => {
    return <h3 key={key}>{message}</h3>;
  };

  const messageRows = [];
  if (roundMessage && roundMessage.winner && roundMessage.winner.length === 1) {
    for (const key in roundMessage.winner) {
      const winner = roundMessage.winner[key];
      messageRows.push(
        renderMessage(winner.playerName + " wins the pot", messageRows.length)
      );
    }
  }
  if (roundMessage && roundMessage.winner && roundMessage.winner.length > 1) {
    let winnerNames = [];
    for (const key in roundMessage.winner) {
      winnerNames.push(roundMessage.winner[key].playerName);
    }
    messageRows.push(
      renderMessage(winnerNames.join(", ") + " win the pot", messageRows.length)
    );
  }
  if (
    roundMessage &&
    roundMessage.bankrupt &&
    roundMessage.bankrupt.length === 1
  ) {
    for (const key in roundMessage.bankrupt) {
      const bankrupt = roundMessage.bankrupt[key];
      messageRows.push(
        renderMessage(bankrupt.playerName + " is bankrupt", messageRows.length)
      );
    }
  }
  if (
    roundMessage &&
    roundMessage.bankrupt &&
    roundMessage.bankrupt.length > 1
  ) {
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
  if (roundMessage && roundMessage.gameover) {
    messageRows.push(
      renderMessage(
        "Everyone has left the table. Redirecting to Home.",
        messageRows.length
      )
    );
  }

  return (
    <div className="row deck-row">
      <div className="deck-row-title p-2">
        <div>
          <h4>Pot</h4>
          <div>Total: {pot} Sats</div>
          <div>Bets: {bets} Sats</div>
        </div>
      </div>
      {messageRows.length === 0 ? (
        <div className="deck-row-cards row">{cardRows}</div>
      ) : (
        <div className="deck-row-message p-2">{messageRows}</div>
      )}
    </div>
  );
};

const mapStateToProps = state => ({
  pot: state.game.pot,
  bets: state.game.players
    ? state.game.players.reduce((total, player) => {
        total += player.bet;
        return total;
      }, 0)
    : 0,
  board: state.game.board,
  roundMessage: state.game.roundMessage
});

export default connect(
  mapStateToProps,
  null
)(Board);
