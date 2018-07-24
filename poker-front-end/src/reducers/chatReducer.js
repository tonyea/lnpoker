import {
  ADD_MESSAGE,
  ADD_USER,
  USERS_LIST,
  MESSAGE_RECEIVED
} from "../actions/types";

export default function(state = [], action) {
  switch (action.type) {
    case ADD_MESSAGE:
    case ADD_USER:
      return state.concat([{ name: action.name, id: action.id }]);
    case USERS_LIST:
      return action.users;
    case MESSAGE_RECEIVED:
      return state.concat([
        {
          message: action.message,
          author: action.author,
          id: action.id
        }
      ]);
    default:
      return state;
  }
}
