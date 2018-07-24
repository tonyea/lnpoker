import React, { Component } from "react";
import io from "socket.io-client/lib";
import { USER_CONNECTED, LOGOUT, CHAT_MESSAGE } from "./Events";
import PropTypes from "prop-types";
import { addMessage } from "../../../actions/chatActions";

// import components
import Users from "./ChatUsers";
import MessagesList from "./MessagesList";
import AddMessage from "./AddMessage";

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: io("http://localhost:3231"),
      user: null, // author
      message: null,
      chatlog: null
    };

    this.state.socket.on("connect", () => {
      console.log("socket connected");
    });

    this.sendMessage = this.sendMessage.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  // Sets the user property in state
  // @param user {id:number, name:string}
  setUser(user) {
    const { socket } = this.state;
    socket.emit(USER_CONNECTED, user);
    this.setState({ user });
  }

  // Sets the user property in state to null
  logout() {
    const { socket } = this.state;
    socket.emit(LOGOUT);
    this.setState({ user: null });
  }

  sendMessage(e) {
    // Don't run default submit action
    e.preventDefault();
    this.props.addMessage(this.state.message, "Me");
    // this.state.socket.emit(CHAT_MESSAGE, this.state.message);
  }

  onChange(e) {
    // store message in state as it is change
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    this.state.socket.on(CHAT_MESSAGE, msg => {
      this.setState({ chatlog: msg });
    });

    return (
      <div className="chat container">
        <form onSubmit={this.sendMessage}>
          <Users />
          <MessagesList />
          <AddMessage />
        </form>
      </div>
    );
  }
}
