import React from "react";
import ChatLog from "./ChatLog";
import ChatInput from "./ChatInput";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { addMessage } from "../../actions/chatActions";

const Chat = ({ chatLog, dispatchAddMessage }) => {
  return (
    <div className="chat container">
      <ChatLog messages={chatLog} />
      <ChatInput addMessage={dispatchAddMessage} />
    </div>
  );
};

Chat.propTypes = {
  chatLog: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      sendDate: PropTypes.number.isRequired
    }).isRequired
  ),
  dispatchAddMessage: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  chatLog: state.chat
});

const mapDispatchToProps = dispatch => ({
  dispatchAddMessage: payload => dispatch(addMessage(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Chat);
