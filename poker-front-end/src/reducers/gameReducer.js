import { RECEIVE_GAME_DATA, SET_ROUND_MESSAGE } from "../actions/types";

const initialState = {
  //
};

const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    // add game to state
    case RECEIVE_GAME_DATA:
      return { ...state, ...action.game };
    case SET_ROUND_MESSAGE:
      return { ...state, roundMessage: { ...action.msg } };
    default:
      return state;
  }
};

export default gameReducer;
