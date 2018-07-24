import React from "react";
import PropTypes from "prop-types";
import { addMessage } from "../../../actions/chatActions";
// imports to connect components to action
import { connect } from "react-redux";

const AddMessage = props => {
  let input;

  return (
    <div className="chat__message">
      <input
        className="chat__message__input"
        onKeyPress={e => {
          if (e.key === "Enter") {
            props.dispatch(input.value, "Me");
            input.value = "";
          }
        }}
        type="text"
        ref={node => {
          input = node;
        }}
        name="message"
        autoComplete="off"
      />
      <button className="chat__message_submit" onClick={this.sendMessage}>
        Send
      </button>
    </div>
  );
};

AddMessage.propTypes = {
  dispatch: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
  dispatch: (message, author) => {
    dispatch(addMessage(message, author));
  }
});

export default connect(
  mapDispatchToProps,
  {}
)(AddMessage);
