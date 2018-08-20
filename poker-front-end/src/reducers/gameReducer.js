import { RECEIVE_GAME_DATA, REQUEST_GAME_DATA } from "../actions/types";

const initialState = {
  //
};

const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_GAME_DATA:
      return { ...state, isFetching: true };
    // add game to state
    case RECEIVE_GAME_DATA:
      return { ...state, ...action.game, isFetching: false };
    default:
      return state;
  }
};

export default gameReducer;

export const getIsFetching = state => state.isFetching;
