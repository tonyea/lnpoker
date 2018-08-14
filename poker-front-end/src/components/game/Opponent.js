import React from "react";

export default props => (
  <div className="col-sm">
    <div>Player: {props.playerInfo.username}</div>
    <div>Chips: {props.playerInfo.chips}</div>
    {props.playerInfo.dealer ? <div>Dealer</div> : null}
  </div>
);
