import React from "react";
import Card from "./Card";

const Board = props => {
  const renderCard = (cardType, key) => {
    return <Card card={cardType} key={key} className="col-sm" />;
  };

  const { id, smallblind, bigblind, pot, board } = props;
  console.log(board);
  const cardRows = [];
  for (const key in board) {
    const element = board[key];
    cardRows.push(renderCard(element, key));
  }

  return (
    <div className="row deck-row">
      <div className="deck-row-title p-2">
        Game # {id}
        <div>Pot: {pot} Sats</div>
        <div>Small Blind: {smallblind} Sats</div>
        <div>Big Blind: {bigblind} Sats</div>
      </div>
      {cardRows}
    </div>
  );
};

export default Board;
