// using test database
const app = require("../app");
const request = require("supertest");
const db = require("../db");

describe("User Auth Tests", () => {
  // setup and teardown of DB
  beforeEach(async () => {
    try {
      await db.query("DELETE FROM user_table");
      await db.query("DELETE FROM tables");
      await db.query("DELETE FROM users");
    } catch (e) {
      console.log(e);
    }
  });

  /**
    Client browser hits api/users/register with POST requets and form filled with a username, password and password 2. API returns user profile
  **/
  describe("User Registration", () => {
    const testusername = "testees";
    const testpassword = "password";

    const registerUser = async (username, password) => {
      return await request(app)
        .post("/api/users/register")
        .send({
          name: username,
          password: password,
          password2: password
        });
    };
    test("It should respond with valid POST method", async () => {
      expect.assertions(2);

      const res = await registerUser(testusername, testpassword);

      // check to see if response is ok
      expect(res.statusCode).toBe(200);

      // check to see if profiled data is returned
      expect(res.body.username).toEqual(testusername);
      // return;
    });

    // check to see if profile data is persisted to DB
    test("DB should have persisted user", async () => {
      expect.assertions(2);

      await registerUser(testusername, testpassword);

      const user = await db.query(
        "SELECT username, password from users where username=$1",
        [testusername]
      );

      expect(user.rows[0].username).toEqual(testusername);

      // Check that the password is not same plaintext
      expect(user.rows[0].password).not.toBe(testpassword);
    });

    // // Client browser hits api/users/register with POST request and form filled with special char username, password or password 2. API returns error
    describe("Test bad registrations", () => {
      // bad usernames should return errors
      test("Bad usernames", async () => {
        const badusername = "Test User&*%";

        expect.assertions(2);

        const res = await registerUser(badusername, testpassword);

        // check to see if response is bad
        expect(res.statusCode).toBe(400);

        // return error message
        expect(res.body.username).toContain("characters");
      });
    });

    //  Client browser hits api/users/register with POST requets and form filled with a mismatched password and password 2. API returns error.
    test("Password 1 and 2 must match", async () => {
      expect.assertions(2);

      const res = await request(app)
        .post("/api/users/register")
        .send({
          name: testusername,
          password: testpassword,
          password2: "randomxyz"
        });

      // check to see if response is bad
      expect(res.statusCode).toBe(400);

      // return error message
      expect(res.body.password2).toContain("match");
    });

    //  Client browser hits api/users/register with POST requets and form filled with a preexisting username. API returns error.
    test("No duplicate usernames allowed", async () => {
      expect.assertions(2);

      // creating duplicate users with nested promises
      await registerUser(testusername, testpassword);

      const res = await registerUser(testusername, testpassword);

      // check to see if response is bad
      expect(res.statusCode).toBe(400);

      // return error message
      expect(res.body.username).toContain("exists");
    });
  });

  // Client browser hits api/users/login with POST request and form filled with username and password. API returns user
  describe("User login", () => {
    const testusername = "loginusername";
    const testpassword = "loginpassword";

    // create user before all login tests are executed
    beforeEach(() => {
      return request(app)
        .post("/api/users/register")
        .send({
          name: testusername,
          password: testpassword,
          password2: testpassword
        });
    });

    const loginUser = async (username, password) => {
      return request(app)
        .post("/api/users/login")
        .send({
          name: username,
          password: password
        });
    };

    test("User found", async () => {
      expect.assertions(2);

      const res = await loginUser(testusername, testpassword);

      // check to see if response is bad
      expect(res.statusCode).toBe(200);

      // return error message
      expect(res.body.success).toBe(true);
    });

    test("Password incorrect", async () => {
      expect.assertions(2);

      const res = await loginUser(testusername, "badpass");

      // check to see if response is bad
      expect(res.statusCode).toBe(400);

      // return error message
      expect(res.body.password).toContain("Password incorrect");
    });

    test("User not found", async () => {
      expect.assertions(2);

      const res = await loginUser("baduser", testpassword);

      // check to see if response is bad
      expect(res.statusCode).toBe(404);

      // return error message
      expect(res.body.username).toContain("not found");
    });
  });
});
