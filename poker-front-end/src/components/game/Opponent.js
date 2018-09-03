import React from "react";
import Card from "./Card";

export default ({ playerInfo }) => (
  <div
    className={
      playerInfo.currentplayer
        ? "col-sm text-sm-center current-player"
        : "col-sm text-sm-center"
    }
  >
    <div className="card text-center">
      <div className="card-header">{playerInfo.username}</div>
      <div className="card-body">
        <h5 className="card-title">
          {playerInfo.currentplayer ? <div>Thinking</div> : <div>Waiting</div>}
        </h5>
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
      <div className="card-footer text-muted">{playerInfo.chips} Sats</div>
    </div>
  </div>
);
