// separating out app from server for testing to work
const app = require("./app");

// include env variables
require("dotenv").config();

// connecting Postgres
// const pg = require("./db");

// Set port
const port = process.env.PORT || 5000;

//In a test environment, when running the server through Supertest, we do not really need to have the app listen on a network port
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
