import React from "react";
import Modal from "react-bootstrap4-modal";

export default props => {
  const { modalshow, modalClose, buyin, handleChange, callNextModal } = props;
  return (
    <Modal visible={modalshow} onClickBackdrop={modalClose}>
      <div className="modal-header">
        <h5 className="modal-title">Set buy-in amount in Satoshis</h5>
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
        <div className="input-group">
          <input
            type="number"
            className="form-control mb-2"
            value={buyin}
            onChange={handleChange}
            step="100"
            min="100"
            max="100000000"
          />
          <input
            type="range"
            className="custom-range"
            id="formControlRange"
            value={buyin}
            min="100"
            max="100000"
            step="100"
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={modalClose}
        >
          Close
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={callNextModal}
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
};
