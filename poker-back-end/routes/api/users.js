const express = require("express");
const router = express.Router();

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post("/register", (req, res) => {
  // res.sendStatus(200);
  res.json(req.body);
});

module.exports = router;
