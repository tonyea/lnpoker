import { RECEIVE_GAME_DATA, SET_ROUND_MESSAGE } from "../actions/types";

const initialState = {
  //
};

const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    // add game to state
    case RECEIVE_GAME_DATA:
      // default to empty round message
      return { ...state, ...action.game, roundMessage: {} };
    case SET_ROUND_MESSAGE:
      return { ...state, roundMessage: { ...action.roundMessage } };
    default:
      return state;
  }
};

export default gameReducer;
