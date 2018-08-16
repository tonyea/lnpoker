// using test database
const app = require("../app");
const request = require("supertest");
const db = require("../db");

describe("Game Tests", () => {
  const player1 = { playerName: "playerone", token: "" };
  const player2 = { playerName: "playertwo", token: "" };
  const player3 = { playerName: "playerthree", token: "" };
  const player4 = { playerName: "playerfour", token: "" };
  const player5 = { playerName: "playerfive", token: "" };
  const testpassword = "password";

  // setup and teardown of DB
  beforeAll(async () => {
    try {
      await db.query("DELETE FROM user_table");
      await db.query("DELETE FROM tables");
      await db.query("DELETE FROM users");
    } catch (e) {
      console.log(e);
    }

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
    expect.assertions(5);

    const res = await request(app)
      .post("/api/game")
      .set("Authorization", player1.token)
      .send();

    // check to see if response is error. User sees waiting warning if first at table
    expect(res.statusCode).toBe(400);
    expect(res.body.players).toEqual("Not enough players");

    // If I am the first player at a table, I see a sign saying that the table is waiting for more players
    // The state of the game in the DB is 'waiting'
    // A game cannot be marked as started without the minimum number of players
    const dbRes = await db.query("SELECT status from tables");

    expect(dbRes.rows[0].status).toEqual("waiting");

    const dbres1 = await db.query(
      "SELECT username from user_table INNER JOIN users on users.id = user_table.player_id WHERE users.username =$1",
      [player1.playerName]
    );
    expect(dbres1.rows[0].username).toEqual(player1.playerName);

    // //User cannot sit at same table twice
    await request(app)
      .post("/api/game")
      .set("Authorization", player1.token)
      .send();

    expect(dbres1.rows.length).toBe(1);
  });

  // I can see other player's info once I join a table. I cannot see their cards.
  test("User can see basic info about other players", async () => {
    expect.assertions(2);
    await request(app)
      .post("/api/game")
      .set("Authorization", player1.token)
      .send();

    const res = await request(app)
      .post("/api/game")
      .set("Authorization", player2.token)
      .send();

    const dbres = await db.query("select * from user_table where table_id=$1", [
      res.body.id
    ]);

    expect(
      res.body.players.find(player => player.username === player2.playerName)
        .username
    ).toEqual(player2.playerName);

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

  // A game is marked as 'started' once the minimum number of players arrive
  test("Minimum players arrive", async () => {
    expect.assertions(2);

    // making request for third player but just as good for second
    const res = await request(app)
      .post("/api/game")
      .set("Authorization", player3.token)
      .send();

    expect(res.statusCode).toBe(200);

    const dbRes = await db.query("SELECT status from tables");

    expect(dbRes.rows[0].status).toEqual("started");
  });

  test("Game start", async () => {
    expect.assertions(2);

    // Once a game starts cards are shuffled and placed in a deck
    const dbRes = await db.query("SELECT deck from tables");

    // deck should have 52 cards
    expect(dbRes.rows[0].deck.length).toBe(52);

    // deck should have nine of hearts
    expect(dbRes.rows[0].deck).toContain("9H");

    // Two cards are distributed to each player at the table

    // I can see my own cards
    // I cannot see my neighbors cards
  });

  // once a game is started, if I join a table, I have to wait for a new round before I can get a hand of cards
  // test("User logs in, gets seated at a table", async () => {
  //   expect.assertions(3);
  // });
});
