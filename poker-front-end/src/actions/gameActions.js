import { GAME_START, GAME_LOADING, GET_ERRORS } from "./types";
import axios from "axios";

export const getGame = () => async dispatch => {
  // dispatch(setGameLoading());

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
    const res = await axios.post("api/game/leave");
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

// // Thunk to Emit message to socket before dispatching a receive message call to get messages from socket
// export const emitMessage = msg => dispatch => {
//   socket.emit("message", msg);
//   // dispatch(addMessage(msg));
//   console.log("message emitted to socket", msg);
// };
