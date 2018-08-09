const express = require("express");
const router = express.Router();
const passport = require("passport");
const Table = require("../../models/Table");

// Load user model
const User = require("../../models/User");

// temp
const poker = require("../../lib/node-poker");

// @route   POST api/game
// @desc    Create a new table if user hasn't already created / joined another table and persist to DB
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // if user doesn't already have a table open then create a new table

    // create a new table
    // using default params instead of destructuring table arguments
    const table = new Table();

    // // persist table to DB
    table
      .save()
      .then(table => res.json(table))
      .catch(err => res.status(404).json(err));
  }

  // return error : could not start a new game
);

// @route   POST api/game/:tableid
// @desc    User can join a table to play poker
// @access  Private
router.post(
  "/:tableid",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};

    Table.findById(req.params.tableid).then(table => {
      if (!table) {
        errors.notable = "There is no table with that id";
        return res.status(404).json(errors);
      }
      // check that the user is allowed to join this table
      async function playerExists() {
        let p;

        try {
          p = await table.players.find(player =>
            player.user.equals("5b6b06f484dd6028eba04756")
          );
        } catch (err) {
          res.status(404).json(err);
        }
        return p;
      }

      // return error if player is already on table
      if (playerExists()) {
        errors.alreadyplaying = "You are already playing on a table";
        return res.status(404).json(errors);
      }
      // add the user to the table
      table.players.push({ user: req.user.id });
      table.save();
      res.json(table);
    });
  }
);

module.exports = router;
