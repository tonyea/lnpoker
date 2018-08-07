import { GAME_START } from "./types";

export const getNewGameData = gameFromServer => ({
  type: GAME_START,
  game: gameFromServer
});

// // Thunk to Emit message to socket before dispatching a receive message call to get messages from socket
// export const emitMessage = msg => dispatch => {
//   socket.emit("message", msg);
//   // dispatch(addMessage(msg));
//   console.log("message emitted to socket", msg);
// };
