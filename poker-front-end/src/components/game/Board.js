import React from "react";
import Card from "./Card";

const Board = props => {
  const renderCard = (cardType, key) => {
    return <Card card={cardType} key={key} className="col-sm" />;
  };

  const { id, smallblind, bigblind, pot, board, roundMessage } = props;
  console.log(board);
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

export default Board;
