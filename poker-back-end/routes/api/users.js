const express = require("express");
const router = express.Router();
const User = require("../../models/User");

// Load input validation
const validateRegisterInput = require("../../validation/register");

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post("/register", (req, res) => {
  // return 400 if errors
  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  // if user doesn't exist, add him to DB

  // create user
  const newUser = new User({
    name: req.body.name,
    password: req.body.password
  });

  newUser
    .save()
    .then(user => res.json(user))
    .catch(err => console.log(err));

  // send 200 status and profile data back
  // return res.status(200).json(req.body);
});

// @route   GET api/users/:name
// @desc    Show user by name
// @access  Public
router.get("/:name", (req, res) => {
  console.log(req.params.name);
  const dbusername = User.findOne({ name: req.params.name })
    .then(user => res.json(user.name))
    .catch(err => console.log(err));

  // res.send(dbusername);
  // res.json(User.findOne({ name: req.params.name }));
});

module.exports = router;
