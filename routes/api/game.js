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
  getTableId,
  all
} = require("../../services/TableService");

// @route   GET api/game/id
// @desc    Get table id that user is active on
// @access  Private
router.get(
  "/id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    getTableId(req.user.id, returnResult(req, res));
  }
);

// @route   GET api/game
// @desc    Get game information that user is active on
// @access  Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const socket = req.app.get("socketio");
    getTable(req.user.id, socket, returnResult(req, res));
  }
);

// @route   GET api/game/all
// @desc    Get game information that user is active on
// @access  Public
router.get("/all", (req, res) => {
  // gameEvents.joinedGame("test", "test1");
  all(returnResult(req, res));
});

// @route   POST api/game/create/:buyin
// @desc    Create a new table if user hasn't already created / joined another table and persist to DB
// @access  Private
router.post(
  "/create/:buyin",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const socket = req.app.get("socketio");
    createNewTable(
      req.user.id,
      req.params.buyin,
      socket,
      returnResult(req, res)
    );
  }
);

// @route   POST api/game/:tableID
// @desc    Join table with specified ID
// @access  Private
router.post(
  "/join/:tableID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    joinTable(
      req.params.tableID,
      req.user.id,
      req.app.get("socketio"),
      returnResult(req, res)
    );
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
    check(req.user.id, req.app.get("socketio"), returnResult(req, res));
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
    fold(req.user.id, req.app.get("socketio"), returnResult(req, res));
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
    bet(
      req.user.id,
      req.params.amount,
      req.app.get("socketio"),
      returnResult(req, res)
    );
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
    call(req.user.id, req.app.get("socketio"), returnResult(req, res));
  }
);

// callback function that returns error or emit's success response to socket clients. It uses closure scope to get req and res
const returnResult = (req, res) => {
  return (errors, resultFromCaller = {}) => {
    // const ee = req.app.get("eventemitter");
    if (errors) {
      // if error is "timedout" then force currentplayer exit, else return error as is
      if (errors.timedout) {
        return exitTable(
          req.user.id,
          req.app.get("socketio"),
          returnResult(req, res)
        );
      } else {
        res.status(400);
        return res.json(errors);
      }
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
    exitTable(req.user.id, req.app.get("socketio"), returnResult(req, res));
    console.log("exited");
  }
);

module.exports = router;
