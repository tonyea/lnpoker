import React from "react";
import Modal from "react-bootstrap4-modal";
import QRCode from "qrcode.react";

export default props => {
  const { modalshow, modalClose, paymentrequest, nodeuri } = props;
  if (paymentrequest === "" || nodeuri === "") {
    return null;
  }
  return (
    <Modal visible={modalshow} onClickBackdrop={modalClose}>
      <div className="modal-header">
        <h5 className="modal-title">Send payment </h5>
        <button
          type="button"
          className="close"
          onClick={modalClose}
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div className="modal-body">
        <div className="modal-body-payreq">
          <strong>Send payment to following payment request: </strong>
          {paymentrequest}
        </div>
        <QRCode value={paymentrequest} />

        <div className="modal-body-nodeuri">
          <strong>
            If you are unable to route the payment, you may create a direct
            channel through this URI with a minimum funding payment of 20k Sats:
          </strong>
          {" " + nodeuri}
        </div>
        <QRCode value={nodeuri} />
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={modalClose}
        >
          Close
        </button>
        <button type="button" className="btn btn-success">
          Save changes
        </button>
      </div>
    </Modal>
  );
};
