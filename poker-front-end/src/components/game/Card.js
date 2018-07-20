import React from "react";

// gets string argument with card name, e.g. 3D=3 of Diamonds, renders into card CSS and returns
export default props => {
  return <div className="col-sm">{props.value}</div>;
};
