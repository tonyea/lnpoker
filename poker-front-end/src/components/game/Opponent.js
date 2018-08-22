import React from "react";

export default ({ playerInfo }) => (
  <div className="col-sm">
    <div>Player: {playerInfo.username}</div>
    <div>Chips: {playerInfo.chips}</div>
    {playerInfo.dealer ? <div>Dealer</div> : null}
    {playerInfo.currentplayer ? <div>My Turn</div> : <div>Waiting</div>}
  </div>
);
