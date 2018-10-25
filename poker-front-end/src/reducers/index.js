import { combineReducers } from "redux";
import authReducer from "./authReducer";
import errorReducer from "./errorReducer";
import chatReducer from "./chatReducer";
import gameReducer from "./gameReducer";

export default combineReducers({
  auth: authReducer,
  errors: errorReducer,
  chat: chatReducer,
  game: gameReducer
});
