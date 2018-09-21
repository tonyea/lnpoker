const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const passport = require("passport");

// include env variables
require("dotenv").config();

// get route files
const users = require("./routes/api/users");
const game = require("./routes/api/game");

// sockets
const ioServer = require("./socket-server")(app);
const sock_port = process.env.SOCKET_PORT || 8010; // Set socket port
if (process.env.NODE_ENV !== "test") {
  ioServer.listen(sock_port, () =>
    console.log(`Socket listening on port ${sock_port}!`)
  );
}

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Passport middleware
app.use(passport.initialize());
// Passport Config
require("./passport")(passport);

// get request to homepage
app.get("/", (req, res) => {
  res.status(200).send("Lightning Poker - Bitcoin on the Lightning Network");
});

// connect express to route file
app.use("/api/users", users);
app.use("/api/game", game);

module.exports = app;
