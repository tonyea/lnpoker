const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
// const mongoose = require("mongoose");
// const User = mongoose.model("users");
const db = require("./db");

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// using env for jwtsecret
require("dotenv").config();
opts.secretOrKey = process.env.jwtSecretOrKey;

module.exports = passport => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        // find user based on token
        const { rows } = await db.query(
          "SELECT id, username, bank FROM users WHERE id = $1",
          [jwt_payload.id]
        );
        if (rows.length > 0) {
          return done(null, rows[0]);
        }
        return done(null, false);
      } catch (err) {
        console.log(err);
      }
    })
  );
};
