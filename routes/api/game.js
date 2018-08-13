const passport = require("passport");
const Router = require("express-promise-router");
const router = new Router();
const { joinTableIfItExists } = require("../../models/Table");

// @route   POST api/game
// @desc    Create a new table if user hasn't already created / joined another table and persist to DB
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
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

module.exports = router;
