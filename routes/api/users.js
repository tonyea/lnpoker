const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// using env for jwtsecret
require("dotenv").config();
const secret = process.env.jwtSecretOrKey;

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

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

// @route   POST api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const username = req.body.name;
  const password = req.body.password;

  // find user by email
  User.findOne({ name: username }).then(user => {
    //check for user
    if (!user) {
      errors.username = "User not found";
      return res.status(404).json(errors);
    }

    // check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User Matched
        const payload = { id: user.id, username: user.name, chips: user.chips }; // create JWT Payload

        // Sign Token
        jwt.sign(payload, secret, { expiresIn: 3600 }, (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token
          });
        });
      } else {
        errors.password = "Password incorrect";
        return res.status(400).json(errors);
      }
    });
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
