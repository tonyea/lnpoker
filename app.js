const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const passport = require("passport");

// get route files
const users = require("./routes/api/users");
const game = require("./routes/api/game");

// sockets
require("./socket-server")(app);

// // testing grpc
// const lnrpc = require("./ln-grpc");
// lnrpc.getInfo({}, (err, res) => {
//   console.log(res);
// });

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
