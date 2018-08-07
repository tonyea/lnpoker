// /**
//  * Encapsulates all code for emitting and listening to socket events
//  *
//  */
// const gameEvents = io => {
//   this.handlers = {
//     message: handleMessage,
//     disconnect: handleDisconnect
//   };

//   let msgs = [];

//   const handlemessage = msg => {
//     console.log("message: " + msg);
//     // add message to back end state
//     msgs = [...msgs, msg];
//     // emit all messages to chat subscribers
//     io.emit("chat message", msgs);
//   };
// };

// module.exports = gameEvents;
