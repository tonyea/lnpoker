import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser, getBankFromDB } from "../../actions/authActions";
import { GET_ERRORS } from "../../actions/types";
import numFormat from "../../utils/numFormatter";
import WithdrawModal from "../layout/WithdrawModal";
import axios from "axios";

class Navbar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalshow: false,
      response: null
    };

    this.modalOpen = this.modalOpen.bind(this);
  }

  onLogoutClick(e) {
    e.preventDefault();
    if (window.confirm("Are you sure you want to logout?")) {
      // Save it!
      this.props.logoutUser();
    } else {
      // Do nothing!
      return;
    }
  }

  modalOpen = () => {
    this.setState({ modalshow: true });
  };
  closeModal = () => {
    this.setState({ modalshow: false });
  };

  submitWithdrawRequest = async payreq => {
    // check if auth
    if (!this.props.auth.isAuthenticated) {
      // redirect to login
      return this.props.history.push("/login");
    }

    // if yes then submit to /api/users/withdraw
    await axios
      .post("/api/users/withdraw/" + payreq)
      .then(res => {
        if (res.status === 200) {
          this.props.getBankFromDB();
          this.setState({
            response: res.data
          });
        }
      })
      .catch(err => {
        this.props.setErrors(err);
      });

    this.closeModal();
  };

  render() {
    const { isAuthenticated, user } = this.props.auth;

    const authLinks = (
      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
          <a onClick={this.modalOpen} className="nav-link">
            Balance: {numFormat(user.bank, 1)} Sats
          </a>
        </li>
        <li className="nav-item">
          <a
            href=""
            className="nav-link"
            onClick={this.onLogoutClick.bind(this)}
          >
            Logout {user.username}
          </a>
        </li>
      </ul>
    );

    const guestLinks = (
      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
          <Link className="nav-link" to="/register">
            Sign Up
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/login">
            Login
          </Link>
        </li>
      </ul>
    );

    return (
      <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">
            Lightning Poker
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#mobile-nav"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mobile-nav">
            {isAuthenticated ? authLinks : guestLinks}
          </div>
        </div>

        <WithdrawModal
          balance={this.props.auth.user.bank}
          modalshow={this.state.modalshow}
          closeModal={this.closeModal}
          submitWithdrawRequest={this.submitWithdrawRequest}
        />
        {this.state.response && (
          <div className="alert alert-info alert-dismissible">
            <a className="close" data-dismiss="alert" aria-label="close">
              &times;
            </a>
            {this.state.response}
          </div>
        )}
      </nav>
    );
  }
}

Navbar.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
});

const mapDispatchToProps = dispatch => ({
  setErrors: err =>
    dispatch({
      type: GET_ERRORS,
      payload: err.response.data
    }),
  getBankFromDB: () => dispatch(getBankFromDB()),
  logoutUser: () => dispatch(logoutUser())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Navbar);
