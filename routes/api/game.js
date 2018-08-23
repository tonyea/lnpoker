const passport = require("passport");
const Router = require("express-promise-router");
const router = new Router();
const {
  joinTableIfItExists,
  checkTurn,
  exitTable
} = require("../../models/Table");

// @route   POST api/game
// @desc    Create a new table if user hasn't already created / joined another table and persist to DB
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // callback function that returns error or table object
    const returnTable = (errors, tableFromCaller = {}) => {
      if (errors) {
        // console.log("errors", errors);
        res.status(400);
        return res.json(errors);
      }

      // console.log("tableFromCaller", tableFromCaller);
      return res.json(tableFromCaller);
    };

    // if table exists and user is not already on table then add user to table, else create a new table
    joinTableIfItExists(returnTable, req.user.id);
  }
);

// @route   POST api/game/:tableid/check
// @desc    User action check
// @access  Private
router.post(
  "/:tableid/check",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};

    // check if it is player's turn
    checkTurn(req.user.id).then(myTurn => {
      // console.log(myTurn);
      if (!myTurn) {
        // return error if not
        errors.notallowed = "Wrong user has made a move";
        return res.status(401).json(errors);
      } else if (myTurn) {
        // check that the person requesting the check is allowed to check

        return res.json("Success");
      }
    });
  }
);

// @route   POST api/game
// @desc    Exit table, persist to DB
// @access  Private
router.post(
  "/leave",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    exitTable(req.user.id);
    console.log("exited");
  }
);

module.exports = router;
