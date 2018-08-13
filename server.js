// separating out app from server for testing to work
const app = require("./app");

// include env variables
require("dotenv").config();

const mongoose = require("mongoose");

// DB Config
const db = process.env.MONGO_URI_DEV;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true } // need this as old connect function is deprecated by mongo
  )
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// connecting Postgres
const pg = require("./db");

// Set port
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
