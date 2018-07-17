const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const bcrypt = require("bcryptjs");

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
  User.findOne({ name: req.body.name }).then(user => {
    if (user) {
      errors.username = "Username already exists";

      return res.status(400).json(errors);
    } else {
      // create user
      const newUser = new User({
        name: req.body.name,
        password: req.body.password
      });

      // hashing passwords
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
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
