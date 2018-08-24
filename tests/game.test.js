// using test database
const app = require("../app");
const request = require("supertest");
const db = require("../db");

describe("Game Tests", () => {
  const players = [
    { playerName: "playerone", token: "" },
    { playerName: "playertwo", token: "" },
    { playerName: "playerthree", token: "" },
    { playerName: "playerfour", token: "" },
    { playerName: "playerfive", token: "" }
  ];
  const testpassword = "password";
  // global variables for current player
  let currentPlayer = {};
  let notCurrentPlayer = {};

  // setup and teardown of DB
  beforeEach(async () => {
    try {
      await db.query("DELETE FROM user_table");
      await db.query("DELETE FROM tables");
      await db.query("DELETE FROM users");
    } catch (e) {
      console.log(e);
    }

    await registerUser(players[0]);
    await loginUser(players[0]);
    await registerUser(players[1]);
    await loginUser(players[1]);
    await registerUser(players[2]);
    await loginUser(players[2]);
    await registerUser(players[3]);
    await loginUser(players[3]);
    await registerUser(players[4]);
    await loginUser(players[4]);

    currentPlayer = {};
    notCurrentPlayer = {};
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

  const joinGame = async player => {
    return await request(app)
      .post("/api/game")
      .set("Authorization", player.token)
      .send();
  };

  test("User logs in, gets seated at a table", async () => {
    expect.assertions(5);

    const res = await joinGame(players[0]);

    // check to see if response is error. User sees waiting warning if first at table
    expect(res.statusCode).toBe(400);
    expect(res.body.players).toEqual("Not enough players");

    // If I am the first player at a table, I see a sign saying that the table is waiting for more players
    // The state of the game in the DB is 'waiting'
    // A game cannot be marked as started without the minimum number of players
    const dbRes = await db.query("SELECT status from tables");
    expect(dbRes.rows[0].status).toEqual("waiting");

    // Second login with same player to check that user cannot sit at same table twice
    await joinGame(players[0]);

    const dbres1 = await db.query(
      "SELECT username from user_table INNER JOIN users on users.id = user_table.player_id WHERE users.username =$1",
      [players[0].playerName]
    );
    expect(dbres1.rows[0].username).toEqual(players[0].playerName);

    // User cannot sit at same table twice
    expect(dbres1.rows.length).toBe(1);
  });

  // I can see other player's info once I join a table. I cannot see their cards.
  test("User can see basic info about other players", async () => {
    expect.assertions(2);
    await joinGame(players[0]);

    const res = await joinGame(players[1]);

    // I can see my(p2) name
    expect(
      res.body.players.find(player => player.username === players[1].playerName)
        .username
    ).toEqual(players[1].playerName);

    const otherPlayer = res.body.players.find(
      player => player.username === players[0].playerName
    );

    // I can see info about the other player except his cards
    expect(otherPlayer).toEqual({
      username: players[0].playerName,
      dealer: true,
      chips: 98000,
      bet: 2000,
      talked: false,
      cards: null,
      isBigBlind: true,
      isSmallBlind: false,
      currentplayer: false,
      lastaction: null
    });
  });

  const playersJoinGame = async () => {
    // first player has to create the table and others can join
    await joinGame(players[0]);
    const dbRes0 = await db.query("select minplayers from tables");
    const numplayers = parseInt(dbRes0.rows[0].minplayers);

    let res;
    switch (numplayers) {
      case 2:
        res = await joinGame(players[1]);
        break;
      case 3:
        await joinGame(players[1]);
        res = await joinGame(players[2]);
      case 4:
        await joinGame(players[1]);
        await joinGame(players[2]);
        res = await joinGame(players[3]);
      case 5:
        await joinGame(players[1]);
        await joinGame(players[2]);
        await joinGame(players[3]);
        res = await joinGame(players[4]);
      default:
        break;
    }

    return res;
  };
  // A game is marked as 'started' once the minimum number of players arrive
  test("Minimum players arrive", async () => {
    expect.assertions(4);

    // get info of last player to arrive at table
    const res = await playersJoinGame();
    const dbRes0 = await db.query("select minplayers from tables");
    const minplayers = parseInt(dbRes0.rows[0].minplayers);

    // last player joining game should get status of 200
    expect(res.statusCode).toBe(200);

    // check that there are only minimum number of players at the table
    const dbRes1 = await db.query("SELECT count(player_id) from user_table");
    expect(parseInt(parseInt(minplayers))).toBe(parseInt(dbRes1.rows[0].count));

    // check that the status has changed to "started"
    const dbRes2 = await db.query("SELECT status from tables");
    expect(dbRes2.rows[0].status).toEqual("started");
    expect(res.body.status).toEqual("started");
  });

  test("Game start", async () => {
    // expect.assertions(14);

    // login minimum number of players and have them join a game
    const res = await playersJoinGame();

    // get deck after min players have joined
    const dbRes = await db.query("select minplayers, deck from tables");
    const minplayers = parseInt(dbRes.rows[0].minplayers);

    const numCardsPopped = minplayers * 2;
    // Once a game starts, cards are shuffled and distributed, balance cards are placed in a deck
    // deck should have 52 minus number of cards held in hand
    const deck = dbRes.rows[0].deck;
    expect(deck.length).toBe(52 - numCardsPopped);

    // get game state from response to last person that joined the game
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

    const game1_player1 = activeGame.players.find(
      player => player.username === players[0].playerName
    );
    const game1_player2 = activeGame.players.find(
      player => player.username === players[1].playerName
    );
    // check that player1's cards are not visible in response but player2's cards are since we are logged in as player2
    expect(game1_player1.cards).toBe(null);
    expect(dbHands).toContain(game1_player2.cards[0]);
    expect(dbHands).toContain(game1_player2.cards[1]);

    // First user at table is identified as dealer and everyone else should not be a dealer
    expect(game1_player1.dealer).toBe(true);
    expect(game1_player2.dealer).toBe(false);

    // First player after dealer is identified as small blind, next as big blind. So in 2 player game, p1 is dealer, p2 is sb, p1 is bb
    expect(game1_player1.isSmallBlind).toBe(false);
    expect(game1_player2.isSmallBlind).toBe(true);
    expect(game1_player1.isBigBlind).toBe(true);
    expect(game1_player2.isBigBlind).toBe(false);

    // User has chips removed for buy in
    const buyinRes = await db.query("SELECT minbuyin from tables limit 1");
    const p1bankRes = await db.query(
      "SELECT bank from users where username = $1",
      [players[0].playerName]
    );
    const p2bankRes = await db.query(
      "SELECT bank from users where username = $1",
      [players[1].playerName]
    );
    expect(p1bankRes.rows[0].bank).toBe(100000 - buyinRes.rows[0].minbuyin);
    expect(p2bankRes.rows[0].bank).toBe(100000 - buyinRes.rows[0].minbuyin);
    // User has blind bets forced - update bets array. Player 1 is big blind, player 2 is smallblind
    expect(game1_player1.chips).toBe(100000 - activeGame.bigblind);
    expect(game1_player2.chips).toBe(100000 - activeGame.smallblind);
    expect(game1_player1.bet).toBe(activeGame.bigblind);
    expect(game1_player2.bet).toBe(activeGame.smallblind);

    // First player is identified and highlighted   // get currentPlayer - dealer +3, else last player -> p2
    expect(game1_player2.currentplayer).toBe(true);
    expect(game1_player1.currentplayer).toBe(false);

    // check that player2's cards are not visible in response but player1's cards once we are logged in as player1
    const p1res = await joinGame(players[0]);

    const activeGame2 = p1res.body;
    const game2_player1 = activeGame2.players.find(
      player => player.username === players[0].playerName
    );
    const game2_player2 = activeGame2.players.find(
      player => player.username === players[1].playerName
    );
    expect(game2_player2.cards).toBe(null);
    expect(dbHands).toContain(game2_player1.cards[0]);
    expect(dbHands).toContain(game2_player1.cards[1]);

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
    );
  });

  const setCurrentPlayer = async () => {
    await db
      .query(
        `select username, currentplayer
      from user_table
      inner join users on users.id = user_table.player_id where currentplayer=true`
      )
      .then(async res1 => {
        // get current player - p2 in 2p game
        currentPlayer = players.find(player => {
          return player.playerName === res1.rows[0].username;
        });

        // get player who is not current - p1 in 2p game
        notCurrentPlayer = players.find(player => {
          return player.playerName !== res1.rows[0].username;
        });
      });
  };

  const getTableID = async () => {
    return await db
      .query("select id from tables limit 1")
      .then(res => res.rows[0].id);
  };
  // // playing poker
  test("Game action - Check", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // Non current user cannot check.  - p1 in 2p game
    const tableID = await getTableID();
    const uri = "/api/game/" + tableID + "/check";
    const resCheckNotCurrent = await request(app)
      .post(uri)
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // notCurrentPlayer is unauthorized
    expect(resCheckNotCurrent.statusCode).toBe(400);
    expect(resCheckNotCurrent.body).toEqual({
      notallowed: "Wrong user has made a move"
    });

    // if any of the other players have made bets then you can't check
    await db.query(
      `UPDATE user_table SET bet = bet + 10000 
    where player_id != (select id from users where username = $2)
    and table_id = $1`,
      [tableID, currentPlayer.playerName]
    );

    // current player should be allowed to check except if there are existing bets
    let resCheckCurrent = await request(app)
      .post(uri)
      .set("Authorization", currentPlayer.token)
      .send();

    expect(resCheckCurrent.statusCode).toBe(400);
    expect(resCheckCurrent.body).toEqual({
      notallowed: "Check not allowed, replay please"
    });

    await db.query(
      `UPDATE user_table SET bet = 0 
    where player_id != (select id from users where username = $2)
    and table_id = $1`,
      [tableID, currentPlayer.playerName]
    );

    resCheckCurrent = await request(app)
      .post(uri)
      .set("Authorization", currentPlayer.token)
      .send();

    // Current user can check if other bets are 0
    expect(resCheckCurrent.statusCode).toBe(200);
    expect(resCheckCurrent.body).toContain("Success");

    // if I'm allowed to check then add 0 to my bet field
    // set talked to true
    await db
      .query(
        `SELECT bet, talked, lastaction FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes1 => {
        expect(parseInt(dbRes1.rows[0].bet)).not.toBe(0);
        expect(dbRes1.rows[0].talked).toBe(true);
        expect(dbRes1.rows[0].lastaction).toBe("check");
      });
  });

  // table progresses from one round to next
  test("Game action - Fold", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // Non current user cannot fold.  - p1 in 2p game
    const tableID = await getTableID();
    const uri = "/api/game/" + tableID + "/fold";
    const resFoldNotCurrent = await request(app)
      .post(uri)
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // notCurrentPlayer is unauthorized
    expect(resFoldNotCurrent.statusCode).toBe(400);
    expect(resFoldNotCurrent.body).toEqual({
      notallowed: "Wrong user has made a move"
    });

    // get bet amount prior to folding
    let betAmount = 0;
    await db
      .query(
        `SELECT bet FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes => {
        betAmount = dbRes.rows[0].bet;
      });
    // // current player should be allowed to fold
    let resFoldCurrent = await request(app)
      .post(uri)
      .set("Authorization", currentPlayer.token)
      .send();

    expect(resFoldCurrent.statusCode).toBe(200);
    expect(resFoldCurrent.body).toContain("Success");

    // // if I'm allowed to fold then set my bet field to 0
    // // set talked to true
    await db
      .query(
        `SELECT bet, talked, lastaction FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes1 => {
        expect(parseInt(dbRes1.rows[0].bet)).toBe(0);
        expect(dbRes1.rows[0].talked).toBe(true);
        expect(dbRes1.rows[0].lastaction).toBe("fold");
      });

    //add my bet to the pot
    await db.query("SELECT pot FROM tables limit 1").then(dbRes2 => {
      expect(parseInt(dbRes2.rows[0].pot)).toBe(betAmount);
    });
  });
  // // table progresses from one round to next
  // test("Game action - Call", async () => {
  //   // login minimum number of players and have them join a game
  //   await joinGame(players[0]);
  //   const dbRes0 = await db.query("select minplayers from tables");
  //   const minplayers = parseInt(dbRes0.rows[0].minplayers);
  //   await playersJoinGame(minplayers);
  // });
  // // table progresses from one round to next
  // test("Game action - Bet", async () => {
  //   // login minimum number of players and have them join a game
  //   await joinGame(players[0]);
  //   const dbRes0 = await db.query("select minplayers from tables");
  //   const minplayers = parseInt(dbRes0.rows[0].minplayers);
  //   await playersJoinGame(minplayers);
  // });
  // // table progresses from one round to next
  // test("Game action - All in", async () => {
  //   // login minimum number of players and have them join a game
  //   await joinGame(players[0]);
  //   const dbRes0 = await db.query("select minplayers from tables");
  //   const minplayers = parseInt(dbRes0.rows[0].minplayers);
  //   await playersJoinGame(minplayers);
  // });

  // // table progresses from one round to next
  // test("Game progresses", async () => {

  //   // login minimum number of players and have them join a game
  //   await joinGame(players[0]);
  //   const dbRes0 = await db.query("select minplayers from tables");
  //   const minplayers = parseInt(dbRes0.rows[0].minplayers);
  //   await playersJoinGame(minplayers);

  //   // players all check and trigger a progress action event

  // });

  //For each player, check
  // if player has not folded
  // and player has not talked(bet) or player's bet is less than the highest bet at the table
  // and player is not all in
  //then set current player as this player and end of round is false
  // else end of round is true

  // if current player is last player, first player is set as current player, else move current player 1 down the table.

  //Move all bets to the pot
  // update roundBets

  // if river
  // set roundname to showdown
  // update all bets to 0
  //Evaluate each hand
  //check for winners and bankrupts
  // game over? or round over?

  // If turn
  // set roundname to river
  //Burn a card
  //Turn a card
  // update all bets to 0
  // set talked to false

  // If flop
  // set roundname to turn
  //Burn a card
  //Turn a card
  // update all bets to 0
  // set talked to false

  // If deal
  // set roundname to flop
  //Burn a card
  //Turn 3 cards
  // update all bets to 0
  // set talked to false

  // once a game is started, if I join a table, I have to wait for a new round before I can get a hand of cards
  // test("User logs in, gets seated at a table", async () => {
  //   expect.assertions(3);
  // });
});
