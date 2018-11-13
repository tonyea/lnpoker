// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const Router = require("express-promise-router");
const router = new Router();
const db = require("../../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// using env for jwtsecret
require("dotenv").config();
const secret = process.env.jwtSecretOrKey;

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// passport for authenticate getbank route
const passport = require("passport");

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post("/register", async (req, res) => {
  // return 400 if errors
  const { errors, isValid } = validateRegisterInput(req.body);

  const userName = req.body.name;
  const unhashedPassword = req.body.password;

  if (!isValid) {
    return res.status(400).json(errors);
  }

  try {
    // if user doesn't exist, add him to DB
    const { rows } = await db.query(
      "SELECT username, bank FROM users WHERE username = $1",
      [userName]
    );
    if (rows.length > 0) {
      errors.username = "Username already exists";
      return res.status(400).json(errors);
    }

    // hashing passwords
    const saltRounds = 10;
    bcrypt.genSalt(saltRounds, function(err, salt) {
      if (err) throw err;
      bcrypt.hash(unhashedPassword, salt, async (err, hash) => {
        if (err) throw err;
        // Store hash in your password DB.
        // create user
        const returnedResult = await db.query(
          "INSERT INTO users(username, password) VALUES ($1, $2) RETURNING username, created_at, bank",
          [userName, hash]
        );
        return res.json(returnedResult.rows[0]);
      });
    });
  } catch (error) {
    return res.status(400).json(error);
  }
});

// @route   POST api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post("/login", async (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const username = req.body.name;
  const password = req.body.password;

  try {
    // if user doesn't exist, add him to DB
    const { rows } = await db.query(
      "SELECT id, username, password, bank FROM users WHERE username = $1",
      [username]
    );
    if (rows.length < 1) {
      errors.username = "User not found";
      return res.status(404).json(errors);
    }
    const user = rows[0];
    // check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // User Matched
      const payload = { id: user.id, username: user.username, bank: user.bank }; // create JWT Payload

      // Sign Token
      jwt.sign(payload, secret, { expiresIn: 3600 }, (err, token) => {
        if (err) {
          throw err;
        }
        return res.json({
          success: true,
          token: "Bearer " + token
        });
      });
    } else {
      errors.password = "Password incorrect";
      return res.status(400).json(errors);
    }
  } catch (e) {
    return res.status(400).json(e);
  }
});

// @route   GET api/users/bank
// @desc    Show bank info
// @access  Public
router.get(
  "/bank",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { rows } = await db.query(
      "SELECT username, bank FROM users WHERE id = $1",
      [req.user.id]
    );
    return res.json(rows[0]);
  }
);

// export our router to be mounted by the parent application
module.exports = router;
