const express = require("express");
const bodyParser = require("body-parser");

// get route files
const users = require("./routes/api/users");
const game = require("./routes/api/game");

const app = express();

// Sockets
const http = require("http").Server(app);
const io = require("socket.io")(http);

io.on("connection", client => {
  console.log("a user connected");

  client.on("message", handlemessage);

  client.on("disconnect", () => console.log("user disconnected"));
});

let msgs = [];

const handlemessage = msg => {
  console.log("message: " + msg);
  // add message to back end state
  msgs = [...msgs, msg];
  // emit all messages to chat subscribers
  io.emit("chat message", msgs);
};

// Set socket port
const sock_port = process.env.SOCKET_PORT || 8000;

http.listen(sock_port, () =>
  console.log(`Socket listening on port ${sock_port}!`)
);

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// get request to homepage
app.get("/", (req, res) => {
  res.status(200).send("Lightning Poker - Bitcoin on the Lightning Network");
});

// connect express to route file
app.use("/api/users", users);
app.use("/api/game", game);

module.exports = app;
