const express = require("express");
const bodyParser = require("body-parser");

// get route files
const users = require("./routes/api/users");
const game = require("./routes/api/game");

const app = express();

// sockets
const server = require("http").Server(app);
const io = require("socket.io")(server);

server.listen(3231);

io.on("connection", socket => {
  console.log("Socket Id: " + socket.id);
  socket.on("CHAT_MESSAGE", msg => {
    io.emit("CHAT_MESSAGE", msg);
  });
});

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
