const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// get route files
const users = require("./routes/api/users");
const game = require("./routes/api/game");

// sockets
const ioServer = require("./socket-server")(app);
const sock_port = process.env.SOCKET_PORT || 8000; // Set socket port
ioServer.listen(sock_port, () =>
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
