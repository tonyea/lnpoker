import axios from "axios";
import { GET_ERRORS, GET_NEW_BOARD_CARDS } from "./types";

// Get newly shuffled board of cards
export const newBoard = () => dispatch => {
  axios
    .get("/api/egame/newtable")
    .then(res => console.log(res)) // show table data
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};
