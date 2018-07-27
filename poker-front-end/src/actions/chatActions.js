import { ADD_MESSAGE } from "./types";

// Add message to chat action creator
export const addMessage = msg => ({
  type: ADD_MESSAGE,
  message: msg
});
