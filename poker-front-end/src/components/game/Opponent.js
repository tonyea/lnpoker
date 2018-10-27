import React from "react";
import Card from "./Card";

export default ({ playerInfo, disabledstate }) => {
  // show animation on current player. if player is unseated then show him transparent
  let myclass, mydiv;
  if (playerInfo.currentplayer && !disabledstate) {
    myclass = "col-sm text-sm-center current-player";
    mydiv = <div>Thinking</div>;
  } else if (!playerInfo.seated) {
    myclass = "col-sm text-sm-center player-transparent";
    mydiv = <div>To be seated</div>;
  } else if (playerInfo.lastaction === "fold") {
    myclass = "col-sm text-sm-center";
    mydiv = <div>Folded</div>;
  } else {
    myclass = "col-sm text-sm-center";
    mydiv = <div>Waiting</div>;
  }

  return (
    <div className={myclass}>
      <div className="card text-center">
        <div className="card-header">{playerInfo.username}</div>
        <div className="card-body">
          <h5 className="card-title">{mydiv}</h5>
          <div className="tokens row mb-2">
            {playerInfo.dealer ? (
              <div className="card-text tokens-d">D</div>
            ) : null}

            {playerInfo.isSmallBlind ? (
              <div className="card-text tokens-sb">SB</div>
            ) : null}

            {playerInfo.isBigBlind ? (
              <div className="card-text tokens-bb">BB</div>
            ) : null}
          </div>
          {playerInfo.cards ? (
            <div className="opponent-cards row">
              <Card card={playerInfo.cards[0]} className="col-sm" />
              <Card card={playerInfo.cards[1]} className="col-sm" />
            </div>
          ) : null}
        </div>
        {playerInfo.bet > 0 ? (
          <p className="card-text">Bet: {playerInfo.bet}</p>
        ) : null}
        <div className="card-footer text-muted">
          Bal: {playerInfo.chips} Sats
        </div>
      </div>
    </div>
  );
};
