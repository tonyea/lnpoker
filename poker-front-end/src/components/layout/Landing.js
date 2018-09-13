import React, { Component } from "react";

class Landing extends Component {
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

  handleSubmit = e => {
    // check if auth

    // if yes then submit to /api/game/create/buyin
    console.log(this.state.buyin);
  };

  render() {
    return (
      <div className="jumbotron container">
        <h1 className="display-4">Poker on the Lightning Network!</h1>
        <p className="lead">
          Play No-limit Texas Hold'em poker while helping test out the lightning
          network.
        </p>
        <hr className="my-4" />
        <p>
          Join one of the tables below or create your own with a custom buy-in.
        </p>
        {/* Trigger Modal */}
        <button
          type="button"
          className="btn btn-success btn-lg"
          data-toggle="modal"
          data-target="#createTableModal"
        >
          Create Table
        </button>

        {/*  Modal  */}
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
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Landing;
