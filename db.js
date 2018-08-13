const { Pool } = require("pg");

const pool = new Pool();

module.exports = {
  query: (text, params) => pool.query(text, params)
};

// // uses environment variables in .env to connect to DB
// const pool = new Pool();

// async function connectPG() {
//   const res = await pool.query("SELECT * FROM lnpoker.USERS");
//   console.log("PG: ", res);
// }

// connectPG();
