const express = require("express");
const router = express.Router();
const passport = require("passport");
const Table = require("../../models/Table");

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
  let table;
  try {
    // find the first table in the DB. This is temporary until we add ability for multiple tables
    table = await Table.findOne().populate("players", "name");

    // if none exists then create a new table
    if (table === null) {
      // create a new table
      // using default params instead of destructuring table arguments
      const table = new Table();

      // append user id to table | auto join the table you create
      table.players.unshift(userID);

      // persist table to DB
      await table.save();

      return cb(null, table);
    }

    let p;
    // get player if he already exists on table

    p = table.players.filter(player => player.equals(userID));
    // return table if player is already on table
    if (p.length > 0) {
      // console.log(table.populate("players").populate("user", "name"));
      return cb(null, table);
    }

    // set player object to requesting user's id if above are false
    // add the user to the table
    table.players.unshift(userID);

    table = await table.save();
  } catch (error) {
    return cb(error);
  }
  return cb(null, table);
}

module.exports = router;
