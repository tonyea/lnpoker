import React, { Component } from "react";
import ChatLog from "./ChatLog";
import ChatInput from "./ChatInput";

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chatLog: [
        {
          message: "Test Message1",
          author: "Test Author1",
          sendDate: "Test Date1"
        },
        {
          message: "Test Message2",
          author: "Test Author2",
          sendDate: "Test Date2"
        }
      ]
    };
  }
  render() {
    return (
      <div className="chat container">
        <ChatLog messages={this.state.chatLog} />
        <ChatInput />
      </div>
    );
  }
}
