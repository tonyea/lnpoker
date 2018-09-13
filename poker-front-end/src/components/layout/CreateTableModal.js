import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import axios from "axios";

class CreateTableModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      buyin: 10000
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange = e => {
    this.setState({ buyin: e.target.value });
  };

  handleSubmit = async e => {
    // check if auth
    if (!this.props.auth.isAuthenticated) {
      // redirect to login
      return this.props.history.push("/login");
    }
    // if yes then submit to /api/game/create/buyin
    await axios.post("/api/game/create/" + this.state.buyin).then(res => {
      if (res.status === 200) {
        return this.props.history.push("/play");
      }
    });
  };

  render() {
    return (
      <div
        className="modal fade"
        id="createTableModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="createTableModalCenterTitle"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="createTableModalCenterTitle">
                Set buy-in amount in Satoshis
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <input
                  type="number"
                  className="form-control mb-2"
                  value={this.state.buyin}
                  onChange={this.handleChange}
                  step="10000"
                />
                <input
                  type="range"
                  className="custom-range"
                  id="formControlRange"
                  value={this.state.buyin}
                  min="10000"
                  max="100000000"
                  step="10000"
                  onChange={this.handleChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={this.handleSubmit}
                data-dismiss="modal"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

CreateTableModal.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(withRouter(CreateTableModal));
