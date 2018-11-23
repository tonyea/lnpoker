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

// connection to Lightning Node
if (process.env.NODE_ENV !== "test") {
  const lnrpc = require("../../ln-grpc");
}
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

// @route   GET api/users/invoice/:amount
// @desc    Generate an LND invoice for a specified amount
// @access  Private
router.get(
  "/invoice/:amount",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    try {
      // create listener for invoice
      let call = lnrpc.subscribeInvoices({});
      call
        .on("data", async invoice => {
          // if invoice is paid then update users bank details
          if (invoice.amt_paid_sat >= invoice.value) {
            await db.query("UPDATE users SET bank = bank + $1 WHERE id = $2", [
              invoice.amt_paid_sat,
              req.user.id
            ]);
          }
          console.log("data", invoice);
        })
        .on("end", () => {
          // The server has finished sending
        })
        .on("status", status => {
          // Process status
          console.log("Current status" + status);
        });

      // generate invoice for specified amount and share with client along with node uri
      lnrpc.addInvoice({ value: req.params.amount }, (err, resp) => {
        if (err !== null) {
          return res.send("Could not generate invoice");
        }
        return res.json({
          pay_req: resp.payment_request,
          node: process.env.NODEURI
        });
      });
    } catch (error) {
      return res.send("Could not generate invoice");
    }
  }
);

// @route   GET api/users/withdraw/:payreq
// @desc    Issue withdrawal to specified payment request
// @access  Private
router.post(
  "/withdraw/:payreq",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // check if user balance is >= 0
      await db
        .query("SELECT bank FROM users WHERE id = $1", [req.user.id])
        .then(resp => {
          const balance = resp.rows[0].bank;

          if (balance > 0) {
            // if yes then refund amount
            const call = lnrpc.sendPayment({});
            call.on("data", async response => {
              // A response was received from the server.
              console.log("payreq res", response);
              if (response.payment_error === null) {
                console.log("Withdrawal sent");
              } else {
                // put the money back in the db
                await db.query("UPDATE users SET bank = $1 WHERE id = $2", [
                  balance,
                  req.user.id
                ]);
              }
            });
            call.on("status", status => {
              // The current status of the stream.
              console.log("payreq status", status);
            });
            call.on("end", () => {
              // The server has closed the stream.
              console.log("payreq closed stream");
            });

            call.write({ payment_request: req.params.payreq });
          }
        });

      // set bank balance to 0
      await db.query("UPDATE users SET bank = 0 WHERE id = $1", [req.user.id]);
      return res.json("Withdrawal request sent...");
    } catch (error) {
      console.log("err", error);
      if (error.payment_error) return res.json(error.payment_error);
      return res.json("Error in attempting withdrawal");
    }
  }
);

// export our router to be mounted by the parent application
module.exports = router;
