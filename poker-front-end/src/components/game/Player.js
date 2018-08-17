import React from "react";
import Card from "./Card";

export default props => {
  const { cards } = props.myInfo;

  // console.log("cards", props.myInfo);
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
    return <div>Waiting for new round</div>;
  }

  return (
    <div className="row player-row">
      <div className="col-sm">Player Info</div>
      <div className="col-sm">{cardRows}</div>
      <div className="col-sm">Pot Info</div>
      <div className="col-sm">Game Info</div>
    </div>
  );
};
