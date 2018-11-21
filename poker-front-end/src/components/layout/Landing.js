import React, { Component } from "react";
import CreateTableModal from "./CreateTableModal";
import CreateTablePaymentModal from "./CreateTablePaymentModal";
import ActiveGames from "./ActiveGames";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import axios from "axios";
import { GET_ERRORS } from "../../actions/types";
import { getBankFromDB } from "../../actions/authActions";
import isEmpty from "../../validation/is-empty";

class Landing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalshow: false,
      paymentmodalshow: false,
      buyin: 100,
      paymentrequest: null,
      nodeuri: null
    };
    this.modalClose = this.modalClose.bind(this);
    this.modalOpen = this.modalOpen.bind(this);
    this.paymentModalClose = this.paymentModalClose.bind(this);
    this.paymentModalOpen = this.paymentModalOpen.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.nextModal = this.nextModal.bind(this);
  }

  _isMounted = false;

  handleChange = e => {
    this.setState({ buyin: e.target.value });
  };

  modalClose = () => {
    this.setState({ modalshow: false });
  };
  modalOpen = () => {
    this.setState({ modalshow: true });
  };
  paymentModalClose = () => {
    this.setState({ paymentmodalshow: false });
  };
  paymentModalOpen = () => {
    this.setState({ paymentmodalshow: true });
  };

  nextModal = () => {
    // debugger;
    if (isEmpty(this.props.errors)) {
      if (this.props.auth.user.bank >= this.state.buyin) {
        this.handleCreateGame();
      } else {
        this.setState({ modalshow: false });
        this.createPaymentRequest();
        this.setState({ paymentmodalshow: true });
      }
    }
  };

  handleCreateGame = async () => {
    // check if auth
    if (!this.props.auth.isAuthenticated) {
      // redirect to login
      return this.props.history.push("/login");
    }
    // if yes then submit to /api/game/create/buyin
    await axios
      .post("/api/game/create/" + this.state.buyin)
      .then(res => {
        if (res.status === 200) {
          this.props.getBankFromDB();
          // console.log("redirecting to /play");
          return this.props.history.push("/play");
        }
      })
      .catch(err => {
        this.props.setErrors(err);
      });
  };

  checkIfPaid = async () => {
    if (this._isMounted) {
      this.props.getBankFromDB();
      if (this.props.auth.user.bank >= this.state.buyin) {
        clearInterval(this.interval);
        this.handleCreateGame();
      }
    }
  };

  createPaymentRequest = async () => {
    // check if auth
    if (!this.props.auth.isAuthenticated) {
      // redirect to login
      return this.props.history.push("/login");
    }
    // if yes then submit to /api/game/create/buyin
    await axios
      .get("/api/users/invoice/" + this.state.buyin)
      .then(res => {
        if (res.status === 200) {
          this.setState({ paymentrequest: res.data.pay_req });
          this.setState({ nodeuri: res.data.node });
          // check server every 5 secs for payment
          this.interval = setInterval(this.checkIfPaid, 5000);
        }
      })
      .catch(err => {
        this.props.setErrors(err);
      });
  };

  componentWillUnmount = () => {
    this._isMounted = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
  };

  componentDidMount = () => {
    this._isMounted = true;
    // check if auth
    if (this.props.auth.isAuthenticated) {
      this.props.getBankFromDB();
    }
  };

  render() {
    return (
      <div className="landing container">
        <div className="jumbotron">
          <h1 className="display-4">Poker on the Lightning Network!</h1>
          <p className="lead">
            Play No-limit Texas Hold'em poker while helping test out the
            lightning network.
          </p>
          <hr className="my-4" />
          <p>
            Join one of the tables below or create your own with a custom
            buy-in.
          </p>
          {/* Trigger Modal */}
          <button
            type="button"
            className="btn btn-success btn-lg"
            onClick={this.modalOpen}
          >
            Create Table
          </button>

          <CreateTableModal
            modalshow={this.state.modalshow}
            modalClose={this.modalClose}
            callNextModal={this.nextModal}
            buyin={this.state.buyin}
            handleChange={this.handleChange}
          />
          <CreateTablePaymentModal
            modalshow={this.state.paymentmodalshow}
            modalClose={this.paymentModalClose}
            paymentrequest={this.state.paymentrequest}
            nodeuri={this.state.nodeuri}
          />
        </div>

        <ActiveGames />
      </div>
    );
  }
}

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
  getBankFromDB: () => dispatch(getBankFromDB())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Landing));
