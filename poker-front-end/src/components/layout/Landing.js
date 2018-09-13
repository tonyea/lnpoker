import React, { Component } from "react";
import CreateTableModal from "./CreateTableModal";
import ActiveGames from "./ActiveGames";

class Landing extends Component {
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
            data-toggle="modal"
            data-target="#createTableModal"
          >
            Create Table
          </button>

          <CreateTableModal />
        </div>

        <ActiveGames />
      </div>
    );
  }
}

export default Landing;
