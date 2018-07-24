import { ADD_MESSAGE, ADD_USER, MESSAGE_RECEIVED, USERS_LIST } from "./types";

let nextMessageId = 0;
let nextUserId = 0;

// add chat message to table. when a message is added by us, we add it to the (local) list of messages
export const addMessage = (message, author) => ({
  type: ADD_MESSAGE,
  id: nextMessageId++,
  message,
  author
});

// add user to table chat. when we add a user (ourselves), we put it in the users list
export const addUser = username => ({
  type: ADD_USER,
  id: nextUserId++,
  username
});

// broadcast message received from server to table. when we receive a message from the server, we add it to our list of messages
export const messageRecieved = (message, author) => ({
  type: MESSAGE_RECEIVED,
  id: nextMessageId++,
  message,
  author
});

// add list of users to table chat. when we get an updated users list from the server, we refresh
export const populateUsersList = users => ({
  type: USERS_LIST,
  users
});
