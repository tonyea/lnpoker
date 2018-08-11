const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  // bank is total number of chips the user has
  bank: {
    type: Number,
    default: 100000
  },
  // Following are specific to a table but since a user cannot join more than one table at a time, these items are refreshed
  // chips are a subset of bank, amount of total chips used for a particular table
  chips: { type: Number, default: 1000 },
  folded: { type: Boolean, default: false },
  allIn: { type: Boolean, default: false },
  talked: { type: Boolean, default: false },
  cards: [String] // cards held by player
});

module.exports = User = mongoose.model("users", UserSchema);
