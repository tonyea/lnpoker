import React, { Component } from "react";
import ChatLog from "./ChatLog";
import ChatInput from "./ChatInput";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { emitMessage, receiveMessages } from "../../actions/chatActions";
// socket
import io from "socket.io-client";

class Chat extends Component {
  render() {
    const { chatLog, dispatchAddMessage, receiveMessages } = this.props;
    const socket = io("http://localhost:8000/");

    socket.on("chat message", msgs => {
      console.log(msgs);
      receiveMessages(msgs);
    });

    return (
      <div className="chat container">
        <ChatLog messages={chatLog} />
        <ChatInput addMessage={dispatchAddMessage} />
      </div>
    );
  }
}

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
  dispatchAddMessage: payload => dispatch(emitMessage(payload)),
  receiveMessages: msgs => dispatch(receiveMessages(msgs))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Chat);
