import React from "react";

export default ({ playerInfo }) => (
  <div className="col-sm text-sm-center">
    <div className="card text-center">
      <div className="card-header">{playerInfo.username}</div>
      <div className="card-body">
        <h5 className="card-title">
          {playerInfo.currentplayer ? <div>Thinking</div> : <div>Waiting</div>}
        </h5>
        {playerInfo.dealer ? <p className="card-text">Dealer</p> : null}
      </div>
      <div className="card-footer text-muted">{playerInfo.chips} Sats</div>
    </div>
  </div>
);
