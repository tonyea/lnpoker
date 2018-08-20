import { SET_GAME_STATE } from "../actions/types";

const initialState = {
  //
};

export default function(state = initialState, action) {
  switch (action.type) {
    // add game to state
    case SET_GAME_STATE:
      // console.log("reducer", action);
      return action.game;
    default:
      return state;
  }
}
