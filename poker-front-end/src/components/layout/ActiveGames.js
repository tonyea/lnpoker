import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import axios from "axios";

class ActiveGames extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activegames: []
    };

    this.joinGame = this.joinGame.bind(this);
  }

  getActiveGames = async () => {
    await axios.get("/api/game/all").then(res => {
      console.log("component did mount refreshing list of games");
      if (res.status === 200) {
        this.setState({ activegames: res.data });
      }
    });
  };

  componentDidMount() {
    this.interval = setInterval(this.getActiveGames, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  joinGame = async () => {
    // check if auth
    if (!this.props.auth.isAuthenticated) {
      // redirect to login
      return this.props.history.push("/login");
    } else {
      await axios.post("/api/game/join/" + this.gameID).then(res => {
        if (res.status === 200) {
          return this.props.history.push("/play");
        }
      });
    }
  };

  render() {
    const renderGameRow = (gameInfo, gameKey) => {
      // return <Card card={gameInfo} key={gameKey} />;
      return (
        <tr key={gameKey}>
          <th scope="row">{parseInt(gameKey, 10) + 1}</th>
          <td>{gameInfo.numplayers + "/" + gameInfo.maxplayers}</td>
          <td>{gameInfo.status}</td>
          <td>{gameInfo.minbuyin} Sats</td>
          <td>
            <button
              type="button"
              className="btn btn-secondary"
              ref={() => (this.gameID = gameInfo.id)}
              onClick={this.joinGame}
            >
              Join
            </button>
          </td>
        </tr>
      );
    };

    const gameRows = [];
    if (this.state.activegames && this.state.activegames.length > 0) {
      for (const key in this.state.activegames) {
        const element = this.state.activegames[key];
        gameRows.push(renderGameRow(element, key));
      }
    } else {
      return (
        <div className="allgames">No active games, please create one.</div>
      );
    }

    return (
      <div>
        <table className="allgames table table-striped table-dark">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col"># Players</th>
              <th scope="col">Status</th>
              <th scope="col">Buy In</th>
              <th scope="col">Join</th>
            </tr>
          </thead>
          <tbody>{gameRows}</tbody>
        </table>
      </div>
    );
  }
}

ActiveGames.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(withRouter(ActiveGames));
