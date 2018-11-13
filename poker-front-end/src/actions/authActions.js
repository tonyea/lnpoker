import axios from "axios";
import { GET_ERRORS, SET_CURRENT_USER, GET_BANK } from "./types";
import setAuthToken from "../utils/setAuthToken";
import jwt_decode from "jwt-decode";

// Register user
export const registerUser = (userData, history) => dispatch => {
  axios
    .post("/api/users/register", userData)
    .then(res => history.push("/login")) // redirect to login
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};

// Login User - Get user token
export const loginUser = userData => dispatch => {
  axios
    .post("/api/users/login", userData)
    .then(res => {
      // Save to local storage - destructuring
      const { token } = res.data;
      // Set token to ls
      localStorage.setItem("jwtToken", token);
      // Set token to Auth header
      setAuthToken(token);
      // Decode token to get user data
      const decoded = jwt_decode(token);
      // Set current user
      dispatch(setCurrentUser(decoded));
    })
    .catch(err => {
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      });
    });
};

// Set logged in User
export const setCurrentUser = decoded => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  };
};

// Log out user
export const logoutUser = () => {
  return dispatch => {
    // remove token from local storage
    localStorage.removeItem("jwtToken");
    // remove auth header for future requests
    setAuthToken(false);
    // Set current user to {} which will set isAuthenticated to false
    dispatch(setCurrentUser({}));
  };
};

// Set bank details on User
const getBank = amount => {
  return {
    type: GET_BANK,
    amount
  };
};

/**
 * Updates the bank balance in state
 * @returns {Function} dispatch action function that updates state of bank in redux
 */
export const getBankFromDB = () => dispatch => {
  axios
    .get("/api/users/bank")
    .then(res => {
      // Set current user
      dispatch(getBank(res.data.bank));
    })
    .catch(err => {
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      });
    });
};
