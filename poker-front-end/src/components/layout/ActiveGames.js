import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import axios from "axios";
import { getBankFromDB } from "../../actions/authActions";
import { GET_ERRORS } from "../../actions/types";

class ActiveGames extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activegames: [],
      loadingtext: "Loading active games..."
    };

    this.joinGame = this.joinGame.bind(this);
  }

  _isMounted = false;

  getActiveGames = async () => {
    await axios.get("/api/game/all").then(res => {
      // console.log("component did mount refreshing list of games");
      if (this._isMounted) {
        if (res.status === 200) {
          this.setState({ activegames: res.data });
        }
        if (this.state.activegames.length === 0) {
          this.setState({ loadingtext: "No active games, please create one." });
        }
      }
    });
  };

  componentDidMount() {
    this._isMounted = true;
    this.setState();
    this.interval = setInterval(this.getActiveGames, 5000);
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearInterval(this.interval);
  }

  joinGame = async () => {
    // check if auth
    if (!this.props.auth.isAuthenticated) {
      // redirect to login
      return this.props.history.push("/login");
    } else {
      console.log("buyin", this.buyin);
      if (this.props.auth.user.bank >= this.buyin) {
        await axios
          .post("/api/game/join/" + this.gameID)
          .then(res => {
            if (res.status === 200) {
              this.props.getBankFromDB();
              return this.props.history.push("/play");
            }
          })
          .catch(err => {
            this.props.setErrors(err);
          });
      } else {
        this.props.setBuyIn(this.buyin);
        this.props.setGameID(this.gameID);
        this.props.createPaymentRequest();
        this.props.paymentmodalshow();
      }
    }
  };

  render() {
    const { errors } = this.props;

    const renderGameRow = (gameInfo, gameKey) => {
      // return <Card card={gameInfo} key={gameKey} />;
      return (
        <tr key={gameKey}>
          <th scope="row">{parseInt(gameKey, 10) + 1}</th>
          <td>{gameInfo.numplayers + "/" + gameInfo.maxplayers}</td>
          <td>{gameInfo.status}</td>
          <td>{gameInfo.minbuyin} Sats</td>
          <td className="allgames join-button-field">
            <button
              type="button"
              className="btn btn-secondary"
              ref={() => {
                this.gameID = gameInfo.id;
                this.buyin = gameInfo.minbuyin;
              }}
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
        <div className="allgames loading-text">{this.state.loadingtext}</div>
      );
    }

    return (
      <div>
        {errors.funds && (
          <div className="alert alert-danger alert-dismissible">
            <a className="close" data-dismiss="alert" aria-label="close">
              &times;
            </a>
            {errors.funds}
          </div>
        )}
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
)(withRouter(ActiveGames));
