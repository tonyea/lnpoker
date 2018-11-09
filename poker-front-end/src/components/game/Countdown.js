import React, { Component } from "react";
import PropTypes from "prop-types";

class Countdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      seconds: 0
    };
  }

  componentDidMount = () => {
    // update every second
    this.interval = setInterval(() => {
      const secondsToEnd = this.calculateCountdown(
        this.props.date,
        this.props.timeout
      );
      secondsToEnd ? this.setState({ seconds: secondsToEnd }) : this.stop();
    }, 1000);
  };

  componentWillUnmount = () => {
    this.stop();
  };

  calculateCountdown(actionDate, timeout) {
    const t1 = new Date(actionDate).getTime();
    const t2 = t1 + timeout;
    const t0 = Date.now();
    const diff = t2 - t0;

    const Seconds_from_T0_to_T2 = diff / 1000;
    const Seconds_Between_Dates = Math.abs(Seconds_from_T0_to_T2);

    // clear countdown when date is reached
    if (Seconds_Between_Dates <= 0) return false;

    return Seconds_Between_Dates.toFixed(0);
  }

  stop() {
    clearInterval(this.interval);
  }

  addLeadingZeros(value) {
    value = String(value);
    while (value.length < 2) {
      value = "0" + value;
    }
    return value;
  }

  render() {
    return (
      <div>
        <h3>{this.addLeadingZeros(this.state.seconds)}</h3>
      </div>
    );
  }
}

Countdown.propTypes = {
  date: PropTypes.string.isRequired,
  timeout: PropTypes.number.isRequired
};

Countdown.defaultProps = {
  date: new Date(),
  timeout: 3000
};

export default Countdown;
