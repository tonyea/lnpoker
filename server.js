// separating out app from server for testing to work
const app = require("./app");

// include env variables
require("dotenv").config();

// connecting Postgres
const pg = require("./db");

// Set port
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
