import React from "react";
import ChatLog from "./ChatLog";
import ChatInput from "./ChatInput";
import { emitMessage } from "../../actions/gameActions";

export const Chat = ({ chatLog, socket }) => (
  <div className="chat container">
    <ChatLog messages={chatLog} />
    <ChatInput addMessage={emitMessage} socket={socket} />
  </div>
);

export default Chat;
