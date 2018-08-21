import React from "react";
import Card from "./Card";

export default props => {
  const { cards, chips, dealer, username, bet } = props.myInfo;

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
      <div className="col-sm">
        <h3>{username}</h3>
        <p>
          Chips:
          {chips}
        </p>
        {dealer ? <div>Dealer</div> : null}
        {bet > 0 ? <div>Bet: {bet}</div> : null}
      </div>
      <div className="col-sm card-row row">{cardRows}</div>
    </div>
  );
};
