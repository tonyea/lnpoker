import React, { Component } from "react";
import Modal from "react-bootstrap4-modal";

class WithdrawalModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      payreq: null
    };

    this.submitWithdrawal = this.submitWithdrawal.bind(this);
  }

  handleChange = e => {
    this.setState({ payreq: e.target.value });
  };

  submitWithdrawal = async () => {
    this.props.submitWithdrawRequest(this.state.payreq).then(res => {
      this.setState({
        response: res
      });
    });
  };

  render() {
    const { balance, modalshow, closeModal } = this.props;
    if (balance < 1) {
      return null;
    }

    return (
      <Modal visible={modalshow} onClickBackdrop={closeModal}>
        <div className="modal-header">
          <h5 className="modal-title">Withdraw funds </h5>
          <button
            type="button"
            className="close"
            onClick={closeModal}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-body-payreq">
            <p>Input your payment request: </p>
            <textarea
              className="modal-body-payreq-withdaw-text"
              value={this.state.payreq}
              onChange={this.handleChange}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeModal}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={this.submitWithdrawal}
          >
            Confirm Withdrawal
          </button>
        </div>
      </Modal>
    );
  }
}

export default WithdrawalModal;
