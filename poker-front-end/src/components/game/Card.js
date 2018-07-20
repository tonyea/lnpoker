import React from "react";
// import image from '../../images/cards/10_of_clubs.png';

// gets string argument with card name, e.g. 3D=3 of Diamonds, renders into card CSS and returns
export default props => {
  let pathToCard = convertCard(props.card);
  return (
    <div className="col-sm card">
      <img src={"/images/cards/" + pathToCard} alt={pathToCard} />
    </div>
  );
};

const convertCard = card => {
  let str = "";
  switch (card[0]) {
    case "J":
      str += "jack";
      break;
    case "Q":
      str += "queen";
      break;
    case "K":
      str += "king";
      break;
    case "A":
      str += "ace";
      break;
    case "T":
      str += "10";
      break;
    default:
      str += card[0];
      break;
  }
  str += "_of_";
  switch (card[1]) {
    case "D":
      str += "diamonds";
      break;
    case "S":
      str += "spades";
      break;
    case "C":
      str += "clubs";
      break;
    case "H":
      str += "hearts";
      break;
    default:
      str += card[1];
      break;
  }
  return (str += ".png");
};
