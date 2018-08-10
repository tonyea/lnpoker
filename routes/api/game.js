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
    const getTableCb = (errors, tableFromCaller = {}) => {
      if (errors) {
        console.log("errors", errors);
        res.status(400);
        return res.json(errors);
      }

      // console.log("tableFromCaller", tableFromCaller);
      return res.json(tableFromCaller);
    };

    // if table exists and user is not already on table then add user to table, else create a new table
    joinTableIfItExists(getTableCb, req.user.id);
  }
);

// @desc - join existing table
// @params - cb is a callback function that takes errors as it's first param, and table state as second. userID takes user id from requesting user
// returns errors or table data
async function joinTableIfItExists(cb, userID) {
  // find the first table in the DB. This is temporary until we add ability for multiple tables
  let table;
  try {
    table = await Table.findOne();
  } catch (err) {
    return cb(err);
  }

  // if none exists then create a new table
  if (table === null) {
    // create a new table
    // using default params instead of destructuring table arguments
    const table = new Table();

    // // persist table to DB

    try {
      await table.save();
    } catch (error) {
      return cb(error);
    }
    return cb(null, table);
  }

  let p;
  // get player if he already exists on table
  try {
    Table.findOne()
      .populate({
        path: "players",
        populate: { path: "user", model: "User" }
      })
      .exec((err, tab) => {
        return tab;
      });
    p = await table.players.find(player => player.user.equals(userID));
  } catch (err) {
    return cb(err);
  }
  // return table if player is already on table
  if (p) {
    // console.log(table.populate("players").populate("user", "name"));
    return cb(null, table);
  }

  // set player object to requesting user's id if above are false
  p = { user: userID };

  // console.log("p", p);
  // add the user to the table
  table.players.push(p);
  try {
    table = await table.save();
  } catch (error) {
    return cb(error);
  }
  return cb(null, table);
}

module.exports = router;
