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

    expect(
      res.body.players.find(player => player.username === player2.playerName)
        .username
    ).toEqual(player2.playerName);

    const otherPlayer = res.body.players.find(
      player => player.username === player1.playerName
    );

    expect(otherPlayer).toEqual({
      username: player1.playerName,
      dealer: true,
      chips: 1000,
      folded: false,
      allin: false,
      talked: false,
      cards: null,
      isBigBlind: true,
      isSmallBlind: false
    });
  });

  // A game is marked as 'started' once the minimum number of players arrive
  test("Minimum players arrive", async () => {
    expect.assertions(3);

    // making another request for second player but just as good for second
    const res = await request(app)
      .post("/api/game")
      .set("Authorization", player2.token)
      .send();

    expect(res.statusCode).toBe(200);

    // check that there are only minimum number of players at the table
    const dbRes0 = await db.query("select minplayers from tables");
    const dbRes1 = await db.query("SELECT count(player_id) from user_table");
    expect(parseInt(parseInt(dbRes0.rows[0].minplayers))).toBe(
      parseInt(dbRes1.rows[0].count)
    );

    const dbRes2 = await db.query("SELECT status from tables");

    expect(dbRes2.rows[0].status).toEqual("started");
  });

  test("Game start", async () => {
    // expect.assertions(14);

    // get minplayers to decide how many cards have been popped from deck
    const dbRes = await db.query("select minplayers, deck from tables");
    const numCardsPopped = parseInt(dbRes.rows[0].minplayers) * 2;
    // Once a game starts, cards are shuffled and distributed, balance cards are placed in a deck
    // deck should have 52 minus number of cards held in hand
    const deck = dbRes.rows[0].deck;
    expect(deck.length).toBe(52 - numCardsPopped);

    // log in as player 2 and I should see my cards in the response
    const res = await request(app)
      .post("/api/game")
      .set("Authorization", player2.token)
      .send();
    const activeGame = res.body;
    // game API should not respond with entire deck
    expect(activeGame.deck).toBe(undefined);

    // check that the deck in the db doesn't have the cards held by the players
    const dbRes1 = await db.query("SELECT cards from user_table");
    const dbHands = dbRes1.rows.map(hand => hand.cards).reduce((arr, hand) => {
      return arr.concat(hand);
    }, []);
    expect(deck).not.toContain(dbHands);
    expect(deck.length + dbHands.length).toBe(52);

    // Check that two cards are distributed to each player at the table
    expect(dbHands.length).toBe(numCardsPopped);
    // check that player1's cards are not visible in response but player2's cards are since we are logged in as player2
    expect(
      activeGame.players.find(player => player.username === player1.playerName)
        .cards
    ).toBe(null);
    expect(dbHands).toContain(
      activeGame.players.find(player => player.username === player2.playerName)
        .cards[0]
    );
    expect(dbHands).toContain(
      activeGame.players.find(player => player.username === player2.playerName)
        .cards[1]
    );

    // First user at table is identified as dealer and everyone else should not be a dealer
    expect(
      activeGame.players.find(player => player.username === player1.playerName)
        .dealer
    ).toBe(true);
    expect(
      activeGame.players.find(player => player.username !== player1.playerName)
        .dealer
    ).toBe(false);

    // First player after dealer is identified as small blind, next as big blind. So in 2 player game, p1 is dealer, p2 is sb, p1 is bb
    expect(
      activeGame.players.find(player => player.username === player1.playerName)
        .isSmallBlind
    ).toBe(false);
    expect(
      activeGame.players.find(player => player.username === player2.playerName)
        .isSmallBlind
    ).toBe(true);
    expect(
      activeGame.players.find(player => player.username === player1.playerName)
        .isBigBlind
    ).toBe(true);
    expect(
      activeGame.players.find(player => player.username === player2.playerName)
        .isBigBlind
    ).toBe(false);

    // check that player2's cards are not visible in response but player1's cards once we are logged in as player1
    const res2 = await request(app)
      .post("/api/game")
      .set("Authorization", player1.token)
      .send();
    const activeGame2 = res2.body;
    expect(
      activeGame2.players.find(player => player.username === player2.playerName)
        .cards
    ).toBe(null);
    expect(dbHands).toContain(
      activeGame2.players.find(player => player.username === player1.playerName)
        .cards[0]
    );
    expect(dbHands).toContain(
      activeGame2.players.find(player => player.username === player1.playerName)
        .cards[1]
    );

    // User can see list of game rules - small blind, big blind, max buy in, min buy in, min players, max players
    //User can see game information: pot, round name, betname, gamestate
    expect(activeGame2).toEqual(
      expect.objectContaining({
        smallblind: expect.any(Number),
        bigblind: expect.any(Number),
        minplayers: expect.any(Number),
        maxplayers: expect.any(Number),
        minbuyin: expect.any(Number),
        maxbuyin: expect.any(Number),
        pot: expect.any(Number),
        roundname: expect.any(String),
        betname: expect.any(String),
        status: expect.any(String)
      })

      // User has chips removed for buy in

      // User has blind bets forced - update bets array

      // First player is identified and highlighted
    );

    // Big blinds
  });

  // playing poker
  // test("Game actions", async () => {

  // });

  // once a game is started, if I join a table, I have to wait for a new round before I can get a hand of cards
  // test("User logs in, gets seated at a table", async () => {
  //   expect.assertions(3);
  // });
});
