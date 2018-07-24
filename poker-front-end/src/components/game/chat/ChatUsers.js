import React from "react";
import PropTypes from "prop-types";

// imports to connect components to action
import { connect } from "react-redux";

const ChatUsers = ({ users }) => (
  <div className="chat__users">
    User List
    <ul>{users.map(user => <li key={user.id}>{user.name}</li>)}</ul>
  </div>
);

ChatUsers.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    }).isRequired
  ).isRequired
};

const mapStateToProps = state => ({
  users: state.users
});

export default connect(
  mapStateToProps,
  {}
)(ChatUsers);
