const passport = require("passport");
const Router = require("express-promise-router");
const router = new Router();
const {
  joinTableIfItExists,
  check,
  fold,
  bet,
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
  "/check",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // callback function that returns error or table object
    const returnResult = (errors, resultFromCaller = {}) => {
      if (errors) {
        // console.log("errors", errors);
        res.status(400);
        return res.json(errors);
      }
      // console.log("resultFromCaller", resultFromCaller);
      return res.json(resultFromCaller);
    };
    // check if it is player's turn
    check(req.user.id, returnResult);
  }
);

// @route   POST api/game/fold
// @desc    User action fold
// @access  Private
router.post(
  "/fold",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // callback function that returns error or table object
    const returnResult = (errors, resultFromCaller = {}) => {
      if (errors) {
        // console.log("errors", errors);
        res.status(400);
        return res.json(errors);
      }
      // console.log("resultFromCaller", resultFromCaller);
      return res.json(resultFromCaller);
    };
    // fold if it is player's turn
    fold(req.user.id, returnResult);
  }
);

// @route   POST api/game/bet-:amount
// @desc    User action bet
// @access  Private
router.post(
  "/bet/:amount",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // callback function that returns error or table object
    const returnResult = (errors, resultFromCaller = {}) => {
      if (errors) {
        // console.log("errors", errors);
        res.status(400);
        return res.json(errors);
      }
      // console.log("resultFromCaller", resultFromCaller);
      return res.json(resultFromCaller);
    };
    // bet if it is player's turn
    bet(req.user.id, req.params.amount, returnResult);
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
