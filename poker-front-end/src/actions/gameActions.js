import {
  GAME_START,
  GAME_LOADING,
  GET_ERRORS,
  ADD_MESSAGE,
  MESSAGE_RECEIVE_SUCCESS
} from "./types";

import axios from "axios";

export const getGame = () => async dispatch => {
  // dispatch(setGameLoading());

  // also dispatch new user to socket?

  try {
    const res = await axios.post("/api/game");
    dispatch(setNewGameState(res.data));
  } catch (error) {
    dispatch({
      type: GET_ERRORS,
      payload: error.response.data
    });
  }
};

export const exitGame = () => async dispatch => {
  // update local game state
  dispatch(setNewGameState({}));
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

export const setNewGameState = gameFromServer => ({
  type: GAME_START,
  game: gameFromServer
});

// Game loading
export const setGameLoading = () => {
  return {
    type: GAME_LOADING
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

// emit message to socket that a new player has been added
export const newPlayerAdded = (socket, id, name) => {
  socket.emit("new player", id, name);
};
