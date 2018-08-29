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
    // console.log(dbRes0.rows);
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
        `
      SELECT username, currentplayer
      FROM user_table
      INNER JOIN users ON users.id = user_table.player_id 
      WHERE currentplayer=true`
      )
      .then(async res => {
        // get current player
        currentPlayer = players.find(player => {
          return player.playerName === res.rows[0].username;
        });

        // get player who is not current
        notCurrentPlayer = players.find(player => {
          return player.playerName !== res.rows[0].username;
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
    const uri = "/api/game/check";
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

  test("Game action - Fold", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // Non current user cannot fold.  - p1 in 2p game
    const uri = "/api/game/fold";
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

  test("Game action - Bet", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // Non current user cannot bet.  - p1 in 2p game
    const uri = "/api/game/bet/10";
    const resBetNotCurrent = await request(app)
      .post(uri)
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // notCurrentPlayer is unauthorized
    expect(resBetNotCurrent.statusCode).toBe(400);
    expect(resBetNotCurrent.body).toEqual({
      notallowed: "Wrong user has made a move"
    });

    // get bet amount prior to betting
    let betLessThanChips = 0;
    let priorBetAmount = 0;
    await db
      .query(
        `SELECT chips, bet FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes => {
        betLessThanChips = parseInt(dbRes.rows[0].chips) - 10;
        priorBetAmount = parseInt(dbRes.rows[0].bet);
      });

    const uriLessThanChips = "/api/game/bet/" + betLessThanChips;

    // current player should be allowed to bet if he does have sufficient chips
    let resBetLessThanChipsCurrentUser = await request(app)
      .post(uriLessThanChips)
      .set("Authorization", currentPlayer.token)
      .send();

    expect(resBetLessThanChipsCurrentUser.statusCode).toBe(200);
    expect(resBetLessThanChipsCurrentUser.body).toContain("Success");

    // // if I'm allowed to bet then set my bet field to bet amount
    // // set talked to true
    await db
      .query(
        `SELECT bet, talked, lastaction, chips FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes1 => {
        expect(parseInt(dbRes1.rows[0].bet)).toBe(
          betLessThanChips + priorBetAmount
        );
        expect(parseInt(dbRes1.rows[0].chips)).toBe(10);
        expect(dbRes1.rows[0].talked).toBe(true);
        expect(dbRes1.rows[0].lastaction).toBe("bet");
      });
  });

  test("Game action - Bet All In", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // Non current user cannot bet.  - p1 in 2p game
    const uri = "/api/game/bet/10";
    const resBetNotCurrent = await request(app)
      .post(uri)
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // notCurrentPlayer is unauthorized
    expect(resBetNotCurrent.statusCode).toBe(400);
    expect(resBetNotCurrent.body).toEqual({
      notallowed: "Wrong user has made a move"
    });

    // get bet amount prior to betting
    let betMoreThanChips = 0;
    let priorBetAmount = 0;
    let totalChips = 0;
    await db
      .query(
        `SELECT chips, bet FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes => {
        totalChips = parseInt(dbRes.rows[0].chips);
        betMoreThanChips = totalChips + 10;
        priorBetAmount = parseInt(dbRes.rows[0].bet);
      });

    const uriMoreThanChips = "/api/game/bet/" + betMoreThanChips;
    // try betting more than the number of chips the user has
    const resBetMoreThanChipsCurrentUser = await request(app)
      .post(uriMoreThanChips)
      .set("Authorization", currentPlayer.token)
      .send();

    // see if I have sufficient number of chips. run all in code if I don't
    // console.log('You don\'t have enought chips --> ALL IN !!!');
    // this.AllIn();
    expect(resBetMoreThanChipsCurrentUser.statusCode).toBe(200);
    expect(resBetMoreThanChipsCurrentUser.body).toContain("All In");

    // // if I'm allowed to bet then set my bet field to bet amount
    // // set talked to true
    await db
      .query(
        `SELECT bet, talked, lastaction, chips FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes1 => {
        expect(parseInt(dbRes1.rows[0].bet)).toBe(totalChips + priorBetAmount);
        expect(parseInt(dbRes1.rows[0].chips)).toBe(0);
        expect(dbRes1.rows[0].talked).toBe(true);
        expect(dbRes1.rows[0].lastaction).toBe("all in");
      });
  });

  test("Game action - Call", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // Non current user cannot bet.  - p1 in 2p game
    const uri = "/api/game/call";
    const resCallNotCurrent = await request(app)
      .post(uri)
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // notCurrentPlayer is unauthorized
    expect(resCallNotCurrent.statusCode).toBe(400);
    expect(resCallNotCurrent.body).toEqual({
      notallowed: "Wrong user has made a move"
    });

    //Match the highest bet
    const res = await db.query(
      `SELECT max(bet) as max
      FROM user_table 
      WHERE table_id = (select table_id 
                          from user_table 
                          INNER JOIN users on users.id = user_table.player_id 
                          where username = $1)`,
      [currentPlayer.playerName]
    );

    const maxBet = parseInt(res.rows[0].max);

    // get bet amount prior to betting
    let totalChips = 0;
    await db
      .query(
        `SELECT chips, bet FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes => {
        totalChips = parseInt(dbRes.rows[0].chips);
      });

    //set current bet to 0 to test bet matching
    await db.query(
      `UPDATE user_table SET bet = 0
         WHERE player_id = (select id from users where username = $1)`,
      [currentPlayer.playerName]
    );

    // current player should be allowed to bet if he does have sufficient chips
    let resCallCurrentUser = await request(app)
      .post(uri)
      .set("Authorization", currentPlayer.token)
      .send();

    expect(resCallCurrentUser.statusCode).toBe(200);
    expect(resCallCurrentUser.body).toContain("Success");

    // if I'm allowed to bet then set my bet field to bet amount
    // set talked to true
    await db
      .query(
        `SELECT bet, talked, lastaction, chips FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes1 => {
        expect(parseInt(dbRes1.rows[0].bet)).toBe(maxBet);
        expect(parseInt(dbRes1.rows[0].chips)).toBe(totalChips - maxBet);
        expect(dbRes1.rows[0].talked).toBe(true);
        expect(dbRes1.rows[0].lastaction).toBe("call");
      });
  });

  // calling with max bet higher than my total chips
  test("Game action - Call - All In", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // Non current user cannot bet.  - p1 in 2p game
    const uri = "/api/game/call";
    const resCallNotCurrent = await request(app)
      .post(uri)
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // notCurrentPlayer is unauthorized
    expect(resCallNotCurrent.statusCode).toBe(400);
    expect(resCallNotCurrent.body).toEqual({
      notallowed: "Wrong user has made a move"
    });

    //Match the highest bet
    const res = await db.query(
      `SELECT max(bet) as max
        FROM user_table 
        WHERE table_id = (select table_id 
                          from user_table 
                          INNER JOIN users on users.id = user_table.player_id 
                          where username = $1)`,
      [currentPlayer.playerName]
    );

    const maxBet = parseInt(res.rows[0].max);

    // get bet amount prior to betting
    let totalChips = 0;
    await db
      .query(
        `SELECT chips, bet FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes => {
        totalChips = parseInt(dbRes.rows[0].chips);
      });

    const lessThanMax = maxBet - 10;
    //set current bet to 0 and chips to less than max to test bet matching - all in
    await db.query(
      `UPDATE user_table SET bet = 0, chips = $2
         WHERE player_id = (select id from users where username = $1)`,
      [currentPlayer.playerName, lessThanMax]
    );

    // current player should be allowed to bet if he does have sufficient chips
    let resCallCurrentUser = await request(app)
      .post(uri)
      .set("Authorization", currentPlayer.token)
      .send();

    expect(resCallCurrentUser.statusCode).toBe(200);
    expect(resCallCurrentUser.body).toContain("All In");

    // if I'm allowed to bet then set my bet field to bet amount
    // set talked to true
    await db
      .query(
        `SELECT bet, talked, lastaction, chips FROM user_table where player_id = (select id from users where username = $1)`,
        [currentPlayer.playerName]
      )
      .then(dbRes1 => {
        expect(parseInt(dbRes1.rows[0].bet)).toBe(lessThanMax);
        expect(parseInt(dbRes1.rows[0].chips)).toBe(0);
        expect(dbRes1.rows[0].talked).toBe(true);
        expect(dbRes1.rows[0].lastaction).toBe("all in");
      });
  });

  // // table progresses from one round to next
  test("Game progresses", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();

    // set current and non-current players
    await setCurrentPlayer();

    // expecting currentplayer to be player2, notcurrentplayer to be p1
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // I can't bet less than highest bet on the table - p2 in 2p game, small blind
    await request(app)
      .post("/api/game/bet/1")
      .set("Authorization", currentPlayer.token)
      .send();

    // current player stays as p2
    await setCurrentPlayer();
    expect(currentPlayer.playerName).toBe(players[1].playerName);

    // smallblind calls - p2 in 2p game
    await request(app)
      .post("/api/game/call")
      .set("Authorization", currentPlayer.token)
      .send();

    // expecting currentplayer to be player1, notcurrentplayer to be p2
    await setCurrentPlayer();
    expect(currentPlayer.playerName).toBe(players[0].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[1].playerName);

    // check if roundname is deal
    await db
      .query("SELECT roundname FROM tables")
      .then(res => expect(res.rows[0].roundname).toBe("Deal"));

    // big blind checks
    await request(app)
      .post("/api/game/check")
      .set("Authorization", currentPlayer.token)
      .send();

    // and triggers progress event again
    // current player becomes non current and vice versa
    await setCurrentPlayer();
    expect(currentPlayer.playerName).toBe(players[1].playerName);
    expect(notCurrentPlayer.playerName).toBe(players[0].playerName);

    // sum of all bets match the pot amount - should be 2x big blind
    let bigBlind;
    await db.query("SELECT pot, bigblind FROM tables").then(res => {
      bigBlind = res.rows[0].bigblind;
      const expectedPot = bigBlind * 2;
      expect(res.rows[0].pot).toBe(expectedPot);
    });

    await db.query("SELECT roundbet, bet, talked FROM user_table").then(res => {
      // all bets are moved to roundBets - roundbets should have 1x big blind each
      expect(res.rows[0].roundbet).toBe(bigBlind);
      expect(res.rows[1].roundbet).toBe(bigBlind);
      // // bets are all set to 0
      expect(res.rows[0].bet).toBe(0);
      expect(res.rows[1].bet).toBe(0);
      // // all talked are set to false
      expect(res.rows[0].talked).toBe(false);
      expect(res.rows[1].talked).toBe(false);
    });

    await db.query("SELECT roundname, deck, board FROM tables").then(res => {
      // roundname changes to flop
      expect(res.rows[0].roundname).toBe("Flop");
      // burn a card and turn 3 - deck should have 4 less cards and board should have 3
      expect(res.rows[0].deck.length).toBe(44);
      expect(res.rows[0].board.length).toBe(3);
    });

    //--- All users check
    await setCurrentPlayer();
    await request(app)
      .post("/api/game/check")
      .set("Authorization", currentPlayer.token)
      .send();
    await request(app)
      .post("/api/game/check")
      .set("Authorization", notCurrentPlayer.token)
      .send();

    await db.query("SELECT roundbet, bet, talked FROM user_table").then(res => {
      // all bets are moved to roundBets - roundbets should have 1x big blind each
      expect(res.rows[0].roundbet).toBe(bigBlind);
      expect(res.rows[1].roundbet).toBe(bigBlind);
      // // bets are all set to 0
      expect(res.rows[0].bet).toBe(0);
      expect(res.rows[1].bet).toBe(0);
      // // all talked are set to false
      expect(res.rows[0].talked).toBe(false);
      expect(res.rows[1].talked).toBe(false);
    });

    await db.query("SELECT roundname, deck, board FROM tables").then(res => {
      // roundname changes to turn
      expect(res.rows[0].roundname).toBe("Turn");
      // burn a card and turn 1 - deck should have 2 fewer cards and board should have 4
      expect(res.rows[0].deck.length).toBe(42);
      expect(res.rows[0].board.length).toBe(4);
    });

    //--- All users check
    await setCurrentPlayer();
    await request(app)
      .post("/api/game/check")
      .set("Authorization", currentPlayer.token)
      .send();
    await request(app)
      .post("/api/game/check")
      .set("Authorization", notCurrentPlayer.token)
      .send();

    await db.query("SELECT roundbet, bet, talked FROM user_table").then(res => {
      // all bets are moved to roundBets - roundbets should have 1x big blind each
      expect(res.rows[0].roundbet).toBe(bigBlind);
      expect(res.rows[1].roundbet).toBe(bigBlind);
      // // bets are all set to 0
      expect(res.rows[0].bet).toBe(0);
      expect(res.rows[1].bet).toBe(0);
      // // all talked are set to false
      expect(res.rows[0].talked).toBe(false);
      expect(res.rows[1].talked).toBe(false);
    });

    await db.query("SELECT roundname, deck, board FROM tables").then(res => {
      // roundname changes to River
      expect(res.rows[0].roundname).toBe("River");
      // // burn a card and turn 1 - deck should have 2 fewer cards and board should have 5
      expect(res.rows[0].deck.length).toBe(40);
      expect(res.rows[0].board.length).toBe(5);
    });

    //--- All users check
    await setCurrentPlayer();
    await request(app)
      .post("/api/game/check")
      .set("Authorization", currentPlayer.token)
      .send();
    await request(app)
      .post("/api/game/check")
      .set("Authorization", notCurrentPlayer.token)
      .send();

    await db.query("SELECT roundbet, bet, talked FROM user_table").then(res => {
      // at end of showdown roundbets are 0
      expect(res.rows[0].roundbet).toBe(0);
      expect(res.rows[1].roundbet).toBe(0);
      // // bets are all set to 0
      expect(res.rows[0].bet).toBe(0);
      expect(res.rows[1].bet).toBe(0);
    });

    await db.query("SELECT roundname, pot FROM tables").then(res => {
      // roundname changes to showdown
      expect(res.rows[0].roundname).toBe("Showdown");
      // pot is 0
      expect(res.rows[0].pot).toBe(0);
    });
  });

  // test certain losing hand against certain winning hand
  test("Game winner and loser testing", async () => {
    // login minimum number of players and have them join a game
    await playersJoinGame();
    // set current and non-current players
    await setCurrentPlayer();
    // sb calls
    await request(app)
      .post("/api/game/call")
      .set("Authorization", currentPlayer.token)
      .send();
    // 'Deal' last check
    await request(app)
      .post("/api/game/check")
      .set("Authorization", notCurrentPlayer.token)
      .send();
    // 'Flop' 1st check
    await request(app)
      .post("/api/game/check")
      .set("Authorization", currentPlayer.token)
      .send();
    // 'Flop' last check
    await request(app)
      .post("/api/game/check")
      .set("Authorization", notCurrentPlayer.token)
      .send();
    // 'Turn' 1st check
    await request(app)
      .post("/api/game/check")
      .set("Authorization", currentPlayer.token)
      .send();
    // 'Turn' last check
    await request(app)
      .post("/api/game/check")
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // winner is decided - set player one with straight, player 2 with pair. expect player one to win, have all chips
    await db.query(
      `
      UPDATE tables SET board = '{8C,6H,7C,JC,6C}'
      WHERE id = (SELECT table_id FROM user_table where player_id = (SELECT id FROM users where username=$1))
      RETURNING *
      `,
      [currentPlayer.playerName]
    );
    // .then(res => {
    //   console.log(res.rows[0]);
    // });
    let roundbet;
    await db
      .query(
        "UPDATE user_table SET cards = '{9C, TC}', chips=0 WHERE player_id = (SELECT id FROM users where username=$1) returning roundbet",
        [currentPlayer.playerName]
      )
      .then(res => (roundbet = res.rows[0].roundbet));

    await db.query(
      "UPDATE user_table SET cards = '{4H, KS}', chips=0 WHERE player_id = (SELECT id FROM users where username=$1)",
      [notCurrentPlayer.playerName]
    );

    // 'River' 1st check
    await request(app)
      .post("/api/game/check")
      .set("Authorization", currentPlayer.token)
      .send();
    // 'River' last check
    await request(app)
      .post("/api/game/check")
      .set("Authorization", notCurrentPlayer.token)
      .send();

    // verify straight flush

    // expect player one to win, have all chips
    await db
      .query(
        "SELECT chips FROM user_table WHERE player_id = (SELECT id FROM users where username=$1)",
        [currentPlayer.playerName]
      )
      .then(res => {
        const expectedChips = roundbet * 2;
        expect(res.rows[0].chips).toBe(expectedChips);
      });

    // check for bankrupt - player 2 should be bankrupt, expect him deleted from db
  });

  // table progresses from one round to next - roundname changes back to 'Deal'

  // test all in player against part in - same as above but player 2 has less than max bet
  // test if winner has a part in 100 out of 300 in his roundBets against 1 player. i.e. His winnings should be +100 not +200. 100 should be returned to other player

  // new round initiation

  // test tie breaker - https://www.adda52.com/poker/poker-rules/cash-game-rules/tie-breaker-rules
  // two royal flushes - slpit pot
  // Two king high straight flush - split pot
  // A King High Straight Flush loses only to a Royal
  // A queen high Straight Flush beats a jack high
  // Both players share 4 of a kind of aces, winner is based on higher kicker. p1 has king kicker, p2 has q, p1 wins.
  // Both players share 4 of a kind of aces, winner is based on higher kicker. p1 and p2 have king kickers, split pot.
  // Aces full of deuces (AAA22) beats Kings full of Jacks (KKKJJ)
  // Aces full of deuces (AAA22) loses Aces full of Jacks (AAAJJ)
  // Aces full of deuces (AAA22) split pot with Aces full of deuces (AAA22)
  // A flush is any hand with five cards of the same suit. If two or more players hold a flush, the flush with the highest card wins. If more than one player has the same strength high card, then the strength of the second highest card held wins. This continues through the five highest cards in the player's hands
  // A straight is any five cards in sequence, but not necessarily of the same suit. If more than one player has a straight, the straight ending in the card wins. If both straights end in a card of the same strength, the hand is tied
  // If more than one player holds three of a kind, then the higher value of the cards used to make the three of kind determines the winner. If two or more players have the same three of a kind, then a fourth card (and a fifth if necessary) can be used as kickers to determine the winner.
  // The highest pair is used to determine the winner. If two or more players have the same highest pair, then the highest of the second pair determines the winner. If both players hold identical two pairs, fifth card is used to break the tie.
  // If two or more players hold a single pair, then highest pair wins. If the pairs are of the same value, the highest kicker card determines the winner. A second and even third kicker can be used if necessary.
  // When no player has even a pair, then the highest card wins. When both players have identical high cards, the next highest card wins, and so on until five cards have been used. In the unusual circumstance that two players hold the identical five cards, the pot would be split.
});
