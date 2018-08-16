// using test database
const app = require("../app");
const request = require("supertest");
const db = require("../db");

describe("User Auth Tests", () => {
  // setup and teardown of DB
  beforeEach(async () => {
    try {
      await db.query("BEGIN;");
      // await db.query("SELECT * FROM lnpoker.tables limit 1");
      await db.query("SAVEPOINT before_all_testing");
    } catch (e) {
      console.log(e);
    }
  });

  afterEach(async () => {
    try {
      // await db.query("ROLLBACK;");
      await db.query("ROLLBACK TO before_all_testing");
      // await db.query("COMMIT");
    } catch (e) {
      console.log(e);
    }
  });

  describe("New Game", () => {
    const player1 = { playerName: "playerone", token: "" };
    const player2 = { playerName: "playertwo", token: "" };
    const player3 = { playerName: "playerthree", token: "" };
    const player4 = { playerName: "playerfour", token: "" };
    const player5 = { playerName: "playerfive", token: "" };
    const testpassword = "password";

    // create players to use in test
    beforeAll(async () => {
      await registerUser(player1);
      await loginUser(player1);

      await registerUser(player2);
      await loginUser(player2);

      await registerUser(player3);
      await loginUser(player3);

      await registerUser(player4);
      await loginUser(player4);

      await registerUser(player5);
      await loginUser(player5);
    });

    const registerUser = async player => {
      await request(app)
        .post("/api/users/register")
        .send({
          name: player.playerName,
          password: testpassword,
          password2: testpassword
        });
    };

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
      expect.assertions(4);

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

      //User cannot sit at same table twice
      await request(app)
        .post("/api/game")
        .set("Authorization", player1.token)
        .send();
      expect(dbres.rows.length).toBe(1);
    });

    // I can see other player's info once I join a table. I cannot see their cards.
    test("User can see basic info about other players", async () => {
      expect.assertions(1);

      const res = await request(app)
        .post("/api/game")
        .set("Authorization", player2.token)
        .send();

      const otherPlayer = res.body.players.find(
        player => player.username === player1.playerName
      );

      expect(otherPlayer).toEqual({
        username: player1.playerName,
        dealer: null,
        chips: 1000,
        folded: false,
        allin: false,
        talked: false
      });
    });

    // If I am the first player at a table, I see a sign saying that the table is waiting for more players
    // The state of the game in the DB is 'waiting'
    test("User sees waiting warning if first at table", async () => {
      expect.assertions(3);

      // starting with fresh db for testing. order of deletion matters because of constraints
      await db.query("DELETE FROM lnpoker.user_table");
      await db.query("DELETE FROM lnpoker.tables");

      const res = await request(app)
        .post("/api/game")
        .set("Authorization", player1.token)
        .send();

      // check to see if response is error
      expect(res.statusCode).toBe(400);
      expect(res.body.players).toEqual("Not enough players");

      // A game cannot be marked as started without the minimum number of players
      const dbRes = await db.query("SELECT status from lnpoker.tables");

      expect(dbRes.rows[0].status).toEqual("waiting");
    });

    // A game is marked as 'started' once the minimum number of players arrive
    test("Minimum players arrive", async () => {
      // expect.assertions(2);

      const res = await request(app)
        .post("/api/game")
        .set("Authorization", player2.token)
        .send();

      expect(res.statusCode).toBe(200);

      // console.log(res.body);

      const dbRes = await db.query("SELECT status from lnpoker.tables");

      expect(dbRes.rows[0].status).toEqual("started");
    });

    // Once a game starts cards are shuffled and placed in a deck
    // Two cards are distributed to each player at the table
    // I can see my own cards
    // I cannot see my neighbors cards
    // test("User logs in, gets seated at a table", async () => {
    //   expect.assertions(3);
    // });

    // once a game is started, if I join a table, I have to wait for a new round before I can get a hand of cards
    // test("User logs in, gets seated at a table", async () => {
    //   expect.assertions(3);
    // });
  });
});
