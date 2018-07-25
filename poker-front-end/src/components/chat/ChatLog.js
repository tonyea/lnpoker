import React from "react";

const ChatLog = props => {
  // Format the chat log to show author and message date
  const messagesMappedToString = props.messages
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

export default ChatLog;
