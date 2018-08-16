// using test database
const app = require("../app");
const request = require("supertest");
const db = require("../db");

describe("User Auth Tests", () => {
  // setup and teardown of DB
  beforeAll(async () => {
    try {
      await db.query("BEGIN");
      // await client.query("COMMIT");
      await db.query("SAVEPOINT before_all_testing");
    } catch (e) {
      console.log(e);
    }
  });

  afterAll(async () => {
    try {
      await db.query("ROLLBACK TO before_all_testing");
    } catch (e) {
      console.log(e);
    } finally {
      db.release();
    }
  });

  describe("New Game", () => {
    const player1 = { playerName: "playerone", token: "" };
    const player2 = "playertwo";
    const player3 = "playerthree";
    const player4 = "playerfour";
    const player5 = "playerfive";
    const testpassword = "password";
    let player1Token, player2Token;

    // create players to use in test
    beforeAll(async () => {
      await request(app)
        .post("/api/users/register")
        .send({
          name: player1.playerName,
          password: testpassword,
          password2: testpassword
        });
    });

    const loginUser = async player => {
      // login users before requests
      const res = await request(app)
        .post("/api/users/login")
        .send({
          name: player.playerName,
          password: testpassword
        });

      player.token = res.body.token;
    };

    test("Guest cannot create a new game", async () => {
      expect.assertions(1);

      const res = await request(app)
        .post("/api/game")
        .send();

      // check to see if response is unauthorized
      expect(res.statusCode).toBe(401);
    });

    test("User logs in, gets seated at a table", async () => {
      expect.assertions(3);
      await loginUser(player1);

      const res = await request(app)
        .post("/api/game")
        .set("Authorization", player1.token)
        .send();

      // check to see if response is ok
      expect(res.statusCode).toBe(200);

      expect(
        res.body.players.find(player => player.username === player1.playerName)
          .username
      ).toEqual(player1.playerName);

      const dbres = await db.query(
        "SELECT username from lnpoker.user_table INNER JOIN lnpoker.users on users.id = user_table.player_id WHERE users.username =$1",
        [player1.playerName]
      );

      expect(dbres.rows[0].username).toEqual(player1.playerName);
    });

    // I cannot get seated if I am already sitting at a table

    // I cannot sit at more than one table at a time

    // I can see other player's info once I join a table. I cannot see their cards.

    // If I am the first player at a table, I see a sign saying that the table is waiting for more players
    // The state of the game in the DB is 'waiting'

    // A game is marked as 'started' once the minimum number of players arrive

    // A game cannot be marked as started without the minimum number of players

    // Once a game starts cards are shuffled and placed in a deck
    // Two cards are distributed to each player at the table
    // I can see my own cards
    // I cannot see my neighbors cards

    // once a game is started, if I join a table, I have to wait for a new round before I can get a hand of cards
  });
});
