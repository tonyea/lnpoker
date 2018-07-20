const validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateLoginInput(data) {
  let errors = {};

  // if username is empty then convert to empty string
  data.name = !isEmpty(data.name) ? data.name : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  // username is required
  if (validator.isEmpty(data.name)) {
    errors.username = "Username is required";
  }

  // password is required
  if (validator.isEmpty(data.password)) {
    errors.password = "Password is required";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
