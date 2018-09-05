const passport = require("passport");
const Router = require("express-promise-router");
const router = new Router();
const {
  joinTableIfItExists,
  check,
  fold,
  bet,
  call,
  exitTable,
  initNewRound
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
    // check if it is player's turn
    check(req.user.id, returnResult(req, res));
  }
);

// @route   POST api/game/fold
// @desc    User action fold
// @access  Private
router.post(
  "/fold",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // fold if it is player's turn
    fold(req.user.id, returnResult(req, res));
  }
);

// @route   POST api/game/bet-:amount
// @desc    User action bet
// @access  Private
router.post(
  "/bet/:amount",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // bet if it is player's turn
    bet(req.user.id, req.params.amount, returnResult(req, res));
  }
);

router.post(
  "/call",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // call if it is player's turn
    call(req.user.id, returnResult(req, res));
  }
);

// callback function that returns error or emit's success response to socket clients. It uses closure scope to get req and res
const returnResult = (req, res) => {
  return (errors, resultFromCaller = {}) => {
    const io = req.app.get("socketio");
    if (errors) {
      // console.log("errors", errors);
      res.status(400);
      return res.json(errors);
    }
    // emit a status update to all players at the table that the table has changed. it will also return the response as is
    if (resultFromCaller === "Success") {
      io.of("/game")
        .in("testroom")
        .emit("table updated");
    }
    // if round message received emit to table
    if (resultFromCaller.winner || resultFromCaller.bankrupt) {
      io.of("/game")
        .in("testroom")
        .emit("round message", resultFromCaller);
    }
    // trigger init new round if winner
    if (resultFromCaller.winner) {
      console.log(resultFromCaller.winner);
      setTimeout(() => {
        initNewRound(req.user.id).then(res => {
          io.of("/game")
            .in("testroom")
            .emit("table updated");
        });
      }, 3000);
    }

    return res.json(resultFromCaller);
  };
};

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
