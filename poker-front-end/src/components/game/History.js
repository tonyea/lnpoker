import React from "react";

export default props => (
  <div className="row history-row">
    <div className="col-sm">Pot Info</div>
    <div className="col-sm">
      Game Info
      <div>Small Blind: {props.smallblind}</div>
      <div>Big Blind: {props.bigblind}</div>
      <div>Min Players: {props.minplayers}</div>
      <div>Max Players: {props.maxplayers}</div>
      <div>Min Buy In: {props.minbuyin}</div>
      <div>Max Buy In: {props.maxbuyin}</div>
      <div>Pot: {props.pot}</div>
      <div>Round Name: {props.roundname}</div>
      <div>Bet Name: {props.betname}</div>
      <div>Status: {props.status}</div>
    </div>
  </div>
);
