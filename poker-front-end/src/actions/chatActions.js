import { ADD_MESSAGE, MESSAGE_RECEIVE_SUCCESS } from "./types";

// // socket
import io from "socket.io-client";
const socket = io("http://localhost:8000/");

// socket.on("chat message", msgs => {
//   store.dispatch(receiveMessages(msgs));
// });

export const receiveMessages = msgs => ({
  type: MESSAGE_RECEIVE_SUCCESS,
  logs: msgs
});

// // Thunk to Emit message to socket before dispatching a receive message call to get messages from socket
export const emitMessage = msg => dispatch => {
  socket.emit("message", msg);
  // dispatch(addMessage(msg));
  console.log("message emitted to socket", msg);
};

// Add message to chat action creator
export const addMessage = msg => ({
  type: ADD_MESSAGE,
  message: msg
});
