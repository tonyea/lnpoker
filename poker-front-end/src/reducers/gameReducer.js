import { GAME_START } from "../actions/types";

const initialState = [
  //
];

export default function(state = initialState, action) {
  switch (action.type) {
    // add game to state
    case GAME_START:
      // console.log("reducer", action);
      return action.game;
    default:
      return state;
  }
}
