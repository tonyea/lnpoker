const passport = require("passport");
const Router = require("express-promise-router");
const router = new Router();
const {
  getTable,
  createNewTable,
  joinTable,
  check,
  fold,
  bet,
  call,
  exitTable,
  initNewRound,
  all
} = require("../../models/Table");

// @route   GET api/game
// @desc    Get game information that user is active on
// @access  Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    getTable(req.user.id, returnResult(req, res));
  }
);

// @route   GET api/game/all
// @desc    Get game information that user is active on
// @access  Public
router.get("/all", (req, res) => {
  all(returnResult(req, res));
});

// @route   POST api/game/create/:buyin
// @desc    Create a new table if user hasn't already created / joined another table and persist to DB
// @access  Private
router.post(
  "/create/:buyin",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    createNewTable(req.user.id, req.params.buyin, returnResult(req, res));
  }
);

// @route   POST api/game/:tableID
// @desc    Join table with specified ID
// @access  Private
router.post(
  "/join/:tableID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    joinTable(req.params.tableID, req.user.id, returnResult(req, res));
  }
);
// @route   POST api/game/check
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

// @route   POST api/game/call
// @desc    User action call
// @access  Private
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
  return (errors, resultFromCaller = {}, tableID = null) => {
    const io = req.app.get("socketio");
    if (errors) {
      // console.log("errors", errors);
      res.status(400);
      return res.json(errors);
    }
    // emit a status update to all players at the table that the table has changed. it will also return the response as is
    if (resultFromCaller === "Success") {
      io.of("/game")
        .in(tableID)
        .emit("table updated");
    }
    // if round message received emit to table
    if (resultFromCaller.winner || resultFromCaller.bankrupt) {
      io.of("/game")
        .in(tableID)
        .emit("round message", resultFromCaller);
    }
    // trigger init new round if winner
    if (resultFromCaller.winner) {
      console.log(resultFromCaller.winner);
      setTimeout(() => {
        initNewRound(req.user.id).then(res => {
          io.of("/game")
            .in(tableID)
            .emit("table updated");
        });
      }, 3000);
    }
    // send message before kicking out last player
    if (resultFromCaller.gameover) {
      setTimeout(() => {
        io.of("/game")
          .in(tableID)
          .emit("gameover");
      }, 3000);
    }

    return res.json(resultFromCaller);
  };
};

// @route   POST api/game/exit
// @desc    Exit table, persist to DB
// @access  Private
router.post(
  "/exit",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    exitTable(req.user.id, returnResult(req, res));
    console.log("exited");
  }
);

module.exports = router;
