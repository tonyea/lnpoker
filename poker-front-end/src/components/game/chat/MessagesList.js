import React, { Component } from "react";
import PropTypes from "prop-types";
import Message from "./Message";
// imports to connect components to action
import { connect } from "react-redux";

const MessagesList = ({ messages }) => (
  <section className="chat__messages-list">
    <ul>
      {messages.map(message => <Message key={message.id} {...message} />)}
    </ul>
  </section>
);

MessagesList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
      author: PropTypes.string.isRequired
    }).isRequired
  ).isRequired
};

const mapStateToProps = state => ({
  messages: state.messages
});

export default connect(
  mapStateToProps,
  {}
)(MessagesList);
