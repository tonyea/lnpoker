const passport = require("passport");
const Router = require("express-promise-router");
const router = new Router();
const db = require("../../db");

// @route   POST api/game
// @desc    Create a new table if user hasn't already created / joined another table and persist to DB
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // callback function that returns error or table object
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
    // table = await Table.findOne().populate("players", "name");
    const { rows } = await db.query("SELECT * FROM lnpoker.tables limit 1");
    // if none exists then create a new table
    if (rows.length < 1) {
      // create a new table
      // using default params instead of destructuring table arguments
      table = await db.query(
        "INSERT INTO lnpoker.tables DEFAULT VALUES returning *"
      ).rows[0];

      // append user id to table | auto join the table you create
      await db.query(
        "INSERT INTO lnpoker.user_table(player_id, table_id) VALUES ($1, $2)",
        [userID, table.id]
      );
      const players = await db.query(
        "SELECT username, dealer, chips, folded, allin, talked, cards FROM lnpoker.users INNER join lnpoker.user_table on lnpoker.users.id = lnpoker.user_table.player_id WHERE lnpoker.user_table.table_id = $1",
        [table.id]
      );

      if (players.rows.length > 0) {
        table.players = players.rows;
      }
      return cb(null, table);
    }

    // get player if he already exists on table
    table = rows[0];
    const player = await db.query(
      "SELECT username FROM lnpoker.users INNER join lnpoker.user_table on lnpoker.users.id = lnpoker.user_table.player_id WHERE lnpoker.user_table.player_id = $1 and lnpoker.user_table.table_id = $2",
      [userID, table.id]
    );

    // return table if player is already on table
    if (player.rows.length > 0) {
      const players = await db.query(
        "SELECT username, dealer, chips, folded, allin, talked, cards FROM lnpoker.users INNER join lnpoker.user_table on lnpoker.users.id = lnpoker.user_table.player_id WHERE lnpoker.user_table.table_id = $1",
        [table.id]
      );
      if (players.rows.length > 0) {
        table.players = players.rows;
      }
      return cb(null, table);
    }

    // set player object to requesting user's id if above are false
    // add the user to the table
    await db.query(
      "INSERT INTO lnpoker.user_table(player_id, table_id) VALUES ($1, $2)",
      [userID, table.id]
    );
    const players = await db.query(
      "SELECT username, dealer, chips, folded, allin, talked, cards FROM lnpoker.users INNER join lnpoker.user_table on lnpoker.users.id = lnpoker.user_table.player_id WHERE lnpoker.user_table.table_id = $1",
      [table.id]
    );

    if (players.rows.length > 0) {
      table.players = players.rows;
    }
  } catch (error) {
    return cb(error);
  }
  return cb(null, table);
}

module.exports = router;
