const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const passport = require("passport");
const path = require("path");

// include env variables
require("dotenv").config();

// get route files
const users = require("./routes/api/users");
const game = require("./routes/api/game");

// sockets
require("./socket-server")(app);

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Passport middleware
app.use(passport.initialize());
// Passport Config
require("./passport")(passport);

// get request to homepage
// app.get("/", (req, res) => {
//   res.status(200).send("Lightning Poker - Bitcoin on the Lightning Network");
// });

// connect express to route file
app.use("/api/users", users);
app.use("/api/game", game);

// serve static assets if in production
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  // set static folder
  app.use(express.static("poker-front-end/build"));

  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "poker-front-end", "build", "index.html")
    );
  });
}

module.exports = app;
