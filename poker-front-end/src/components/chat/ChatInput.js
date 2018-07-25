import React from "react";

export default () => {
  return (
    <div className="input-group mb-3">
      <input
        type="text"
        className="form-control chat chat__input"
        placeholder="Enter chat message"
        aria-label="Enter chat message"
        aria-describedby="basic-addon2"
      />
      <div className="input-group-append chat chat__input__send">
        <button
          className="btn btn-outline-secondary chat chat__input__send-button"
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
};
