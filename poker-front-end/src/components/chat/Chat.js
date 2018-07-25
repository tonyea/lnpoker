import React, { Component } from "react";
import ChatLog from "./ChatLog";
import ChatInput from "./ChatInput";

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chatLog: []
    };

    this.addMessage = this.addMessage.bind(this);
  }

  addMessage(msg, author, timestamp) {
    this.setState({
      chatLog: [
        ...this.state.chatLog,
        { message: msg, author, sendDate: timestamp }
      ]
    });
  }

  render() {
    return (
      <div className="chat container">
        <ChatLog messages={this.state.chatLog} />
        <ChatInput addMessage={this.addMessage} />
      </div>
    );
  }
}
