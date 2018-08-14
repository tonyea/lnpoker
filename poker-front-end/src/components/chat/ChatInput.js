import React, { Component } from "react";

export default class ChatInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      myMsg: ""
    };

    this.onChangeMyMsg = this.onChangeMyMsg.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }

  onChangeMyMsg(e) {
    this.setState({ myMsg: e.target.value });
  }

  sendMessage(e) {
    // send message
    this.props.addMessage(
      {
        message: this.state.myMsg,
        author: "Anthony",
        sendDate: Date.now()
      },
      this.props.socket
    );
    // clear input
    this.setState({ myMsg: "" });
  }

  render() {
    return (
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control chat chat__input"
          placeholder="Enter chat message"
          aria-label="Enter chat message"
          aria-describedby="basic-addon2"
          value={this.state.myMsg}
          onChange={this.onChangeMyMsg}
        />
        <div className="input-group-append chat chat__input__send">
          <button
            className="btn btn-outline-secondary chat chat__input__send-button"
            type="button"
            onClick={this.sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    );
  }
}
