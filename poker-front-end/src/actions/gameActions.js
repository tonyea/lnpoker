import {
  REQUEST_GAME_DATA,
  RECEIVE_GAME_DATA,
  GET_ERRORS,
  ADD_MESSAGE,
  MESSAGE_RECEIVE_SUCCESS
} from "./types";

import axios from "axios";

export const fetchGameData = () => async dispatch => {
  dispatch(requestGameData());

  try {
    const res = await axios.post("/api/game");
    dispatch(receiveGameData(res.data));
  } catch (error) {
    dispatch({
      type: GET_ERRORS,
      payload: error.response.data
    });
  }
};

export const exitGame = () => async dispatch => {
  // update local game state
  dispatch(receiveGameData({}));
  try {
    await axios.post("api/game/leave");
    // console.log(res);
  } catch (error) {
    dispatch({
      type: GET_ERRORS,
      payload: error.response.data
    });
  }
};

const receiveGameData = gameFromServer => ({
  type: RECEIVE_GAME_DATA,
  game: gameFromServer
});

// Game loading
const requestGameData = () => {
  return {
    type: REQUEST_GAME_DATA
  };
};

// Chat component actions

export const receiveMessages = msgs => ({
  type: MESSAGE_RECEIVE_SUCCESS,
  logs: msgs
});

// // Emit message to socket
export const emitMessage = (msg, socket) => {
  socket.emit("message", msg);
};

// Add message to chat action creator
export const addMessage = msg => ({
  type: ADD_MESSAGE,
  message: msg
});

// // emit message to socket that a new player has been added
// export const newPlayerAdded = (socket, id, name) => {
//   socket.emit("new player", id, name);
// };
