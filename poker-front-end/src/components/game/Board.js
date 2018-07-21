import React, { Component } from "react";
import Card from "./Card";
import { connect } from "react-redux";
import { newBoard } from "../../actions/gameActions";
import PropTypes from "prop-types";

class Board extends Component {
  constructor(props) {
    super(props);

    this.state = {
      card1: "AD",
      card2: "3D",
      card3: "4D",
      card4: "5D",
      card5: "6D"
    };

    this.props.newBoard();
  }

  renderCard(cardType) {
    return <Card card={cardType} />;
  }
  render() {
    return (
      <div className="row deck-row">
        {this.renderCard(this.state.card1)}
        {this.renderCard(this.state.card2)}
        {this.renderCard(this.state.card3)}
        {this.renderCard(this.state.card4)}
        {this.renderCard(this.state.card5)}
      </div>
    );
  }
}

// validation on props received
Board.propTypes = {
  // new board function is required
  newBoard: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
});

export default connect(
  mapStateToProps,
  { newBoard }
)(Board);
