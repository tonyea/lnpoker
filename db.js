const { Pool } = require("pg");
// include env variables
require("dotenv").config();

let pool;
// use test db if in test environment
if (process.env.NODE_ENV !== "test") {
  // uses environment variables in .env to connect to DB
  pool = new Pool();
} else {
  pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGTESTDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
  });
}

module.exports = {
  query: (text, params) => pool.query(text, params)
};

// const pool = new Pool();

// async function connectPG() {
//   const res = await pool.query("SELECT * FROM USERS");
//   console.log("PG: ", res);
// }

// connectPG();
