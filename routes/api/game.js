const poker = require("../../lib/node-poker");
const express = require("express");
const router = express.Router();
const passport = require("passport");

// Load game model
// const Game = require("../../models/Game");

// @route   POST api/game
// @desc    Create a new table and persist to DB
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // hardcoded inputs instead of destructuring table arguments
    const smallBlind = 1000;
    const bigBlind = 2000;
    const minPlayers = 2;
    const maxPlayers = 5;
    const minBuyIn = 100000; // min buy in 100k sats
    const maxBuyIn = 100000000; // max buy in 1 BTC = 100m Sats

    // if user doesn't already have a table open then create a new table

    // create a new table
    const table = new poker.Table(
      smallBlind,
      bigBlind,
      minPlayers,
      maxPlayers,
      minBuyIn,
      maxBuyIn
    );

    // test players add
    table.AddPlayer("bob", 1000);
    table.AddPlayer("jane", 1000);

    // formatting for mongodb?
    const newTable = new Game(table);

    // persist table to DB
    newTable
      .save()
      // return json table
      .then(table => res.json(table))
      .catch(err => console.log(err));
  }
);

module.exports = router;
