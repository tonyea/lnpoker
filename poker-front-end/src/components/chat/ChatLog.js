import React from "react";
import PropTypes from "prop-types";

// destructured messages from props.messages
const ChatLog = ({ messages }) => {
  // Format the chat log to show author and message date
  const messagesMappedToString = messages
    .map(msg => {
      return msg.author + ": " + msg.message;
    })
    .join("\n");

  return (
    <div className="input-group chat chat__log">
      <div className="input-group-prepend">
        <span className="input-group-text">Table Chat</span>
      </div>
      <textarea
        className="form-control"
        aria-label="With textarea"
        rows="10"
        readOnly
        value={messagesMappedToString}
      />
    </div>
  );
};

ChatLog.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired,
      sendDate: PropTypes.number.isRequired
    }).isRequired
  )
};

export default ChatLog;
