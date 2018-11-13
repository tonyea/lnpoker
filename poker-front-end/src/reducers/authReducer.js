import isEmpty from "../validation/is-empty";

import { SET_CURRENT_USER, GET_BANK } from "../actions/types";

const initialState = {
  isAuthenticated: false,
  user: {}
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticated: !isEmpty(action.payload),
        user: action.payload
      };
    case GET_BANK:
      return {
        ...state,
        user: { ...state.user, bank: action.amount }
      };
    default:
      return state;
  }
}
