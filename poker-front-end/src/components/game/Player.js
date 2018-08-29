import React from "react";
import Card from "./Card";

export default props => {
  const { cards, chips, dealer, username, bet, currentplayer } = props.myInfo;

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
      <div className="col-sm-12 col-md-6 text-sm-center player-row-info order-sm-3">
        <div className="card text-center">
          <div className="card-header">{username}</div>
          <div className="card-body">
            <h5 className="card-title">
              {currentplayer ? <div>My Turn</div> : <div>Waiting</div>}
            </h5>
            {dealer ? <p className="card-text">Dealer</p> : null}
            {bet > 0 ? <p className="card-text">Bet: {bet}</p> : null}
          </div>
          <div className="card-footer text-muted">{chips} Sats</div>
        </div>
      </div>

      <div className="btn-group-vertical btn-group-sm player-row-buttons">
        <button type="button" className="btn btn-outline-secondary">
          Check
        </button>
        <button type="button" className="btn btn-outline-primary">
          Call
        </button>
        <button type="button" className="btn btn-outline-light">
          Bet
        </button>
        <button type="button" className="btn btn-outline-danger">
          Fold
        </button>
      </div>

      <div className="col-sm-12 col-md-6 player-row-card row order-sm-2">
        {cardRows}
      </div>
    </div>
  );
};
