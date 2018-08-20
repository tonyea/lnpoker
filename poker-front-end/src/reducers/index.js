import { combineReducers } from "redux";
import authReducer from "./authReducer";
import errorReducer from "./errorReducer";
import chatReducer from "./chatReducer";
import gameReducer, * as fromGame from "./gameReducer";

export default combineReducers({
  auth: authReducer,
  errors: errorReducer,
  chat: chatReducer,
  game: gameReducer
});

// top level selectors
export const getIsFetching = state => {
  fromGame.getIsFetching(state.game);
};
