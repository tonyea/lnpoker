import { ADD_MESSAGE, MESSAGE_RECEIVE_SUCCESS } from "../actions/types";

const initialState = [
  // { message: "test", author: "testauthor", sendDate: 23222 }
];

export default function(state = initialState, action) {
  switch (action.type) {
    // add new message to array of message objects
    case ADD_MESSAGE:
      return [...state, action.message];
    case MESSAGE_RECEIVE_SUCCESS:
      // console.log("MESSAGE_RECEIVE_SUCCESS", action.logs);
      return action.logs;
    default:
      return state;
  }
}
