import React from "react";
import Card from "./Card";

const Board = props => {
  // const renderCard = (cardType, key) => {
  //   return <Card card={cardType} key={key} className="col-sm" />;
  // }

  const {
    smallblind,
    bigblind,
    minplayers,
    maxplayers,
    minbuyin,
    maxbuyin,
    pot,
    roundname,
    betname,
    status
  } = props;
  // const cardRows = [];
  // for (const key in this.state) {
  //   const element = this.state[key];
  //   cardRows.push(this.renderCard(element, key));
  // }

  return (
    <div className="row deck-row">
      {/* {cardRows} */}
      <div className="row history-row col-sm">
        <div className="col-sm">
          Round Info
          <div>Pot: {pot}</div>
          <div>Round Name: {roundname}</div>
          <div>Bet Name: {betname}</div>
          <div>Status: {status}</div>
        </div>
        <div className="col-sm">
          Game Info
          <div>Small Blind: {smallblind}</div>
          <div>Big Blind: {bigblind}</div>
          <div>Min Players: {minplayers}</div>
          <div>Max Players: {maxplayers}</div>
          <div>Min Buy In: {minbuyin}</div>
          <div>Max Buy In: {maxbuyin}</div>
        </div>
      </div>
    </div>
  );
};

export default Board;
