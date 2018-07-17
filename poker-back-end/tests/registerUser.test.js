const mongoose = require("mongoose");
// using test database
require("dotenv").config();
const app = require("../app");
const request = require("supertest");
const User = require("../models/User");

// Setup and teardown of DB
// DB Config
const url = process.env.MONGO_URI_TEST;
mongoose.connect(
  url,
  { useNewUrlParser: true }
);

// Test the root path
describe("Test the root path", () => {
  test("It should respond with GET method", () => {
    expect.assertions(2);
    return request(app)
      .get("/")
      .then(response => {
        expect(response.statusCode).toBe(200);
        expect(1).toBe(1);
      });
  });
});

// Test the User MVC
describe("User MVC test", () => {
  // setup and teardown
  beforeAll(async () => {
    await User.remove({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**  
    Client browser hits api/users/register with POST requets and form filled with a username, password and password 2. API returns user profile
  **/
  describe("User Registration", () => {
    const testusername = "testees";
    const testpassword = "password";

    test("It should respond with valid POST method", () => {
      expect.assertions(2);
      return request(app)
        .post("/api/users/register")
        .send({
          name: testusername,
          password: testpassword,
          password2: testpassword
        })
        .then(res => {
          // check to see if response is ok
          expect(res.statusCode).toBe(200);

          // check to see if profiled data is returned
          expect(res.body.name).toEqual(testusername);
          // console.log(res.body);
        });
    });

    // check to see if profile data is persisted to DB
    test("DB should have persisted user", () => {
      expect.assertions(2);
      return User.findOne({ name: testusername }).then(user => {
        expect(user.name).toEqual(testusername);

        // Check that the password is not same plaintext
        expect(user.password).not.toBe(testpassword);
      });
    });
  });

  // Client browser hits api/users/register with POST request and form filled with special char username, password or password 2. API returns error
  describe("Test bad registrations", () => {
    // bad usernames should return errors
    test("Bad usernames", () => {
      const testusername = "Test User&*%";
      const testpassword = "password";

      expect.assertions(2);
      return request(app)
        .post("/api/users/register")
        .send({
          name: testusername,
          password: testpassword,
          password2: testpassword
        })
        .then(res => {
          // check to see if response is bad
          expect(res.statusCode).toBe(400);

          // return error message
          expect(res.body.username).toContain("characters");
        });
    });

    //  Client browser hits api/users/register with POST requets and form filled with a mismatched password and password 2. API returns error.
    test("Password 1 and 2 must match", () => {
      const testusername = "gooduser";
      const testpassword = "password";

      expect.assertions(2);
      return request(app)
        .post("/api/users/register")
        .send({
          name: testusername,
          password: testpassword,
          password2: "randomxyz"
        })
        .then(res => {
          // check to see if response is bad
          expect(res.statusCode).toBe(400);

          // return error message
          expect(res.body.password2).toContain("match");
        });
    });

    //  Client browser hits api/users/register with POST requets and form filled with a preexisting username. API returns error.
    test("No duplicate usernames allowed", () => {
      const duplicateuser = "gooduser";
      const testpassword = "password";

      expect.assertions(2);

      // creating duplicate users with nested promises
      return request(app)
        .post("/api/users/register")
        .send({
          name: duplicateuser,
          password: testpassword,
          password2: testpassword
        })
        .then(res => {
          return request(app)
            .post("/api/users/register")
            .send({
              name: duplicateuser,
              password: testpassword,
              password2: testpassword
            })
            .then(res => {
              // check to see if response is bad
              expect(res.statusCode).toBe(400);

              // return error message
              expect(res.body.username).toContain("exists");
            });
        });
    });
  });

  // Client browser hits api/users/login with POST request and form filled with username and password. API returns user
  describe("User login", () => {
    const testusername = "loginusername";
    const testpassword = "loginpassword";

    // create user before all login tests are executed
    beforeAll(() => {
      return request(app)
        .post("/api/users/register")
        .send({
          name: testusername,
          password: testpassword,
          password2: testpassword
        });
    });

    test("User found", () => {
      expect.assertions(2);

      return request(app)
        .post("/api/users/login")
        .send({
          name: testusername,
          password: testpassword
        })
        .then(res => {
          // check to see if response is bad
          expect(res.statusCode).toBe(200);

          // return error message
          expect(res.body.success).toBe(true);
        });
    });

    test("Password incorrect", () => {
      expect.assertions(2);

      return request(app)
        .post("/api/users/login")
        .send({
          name: testusername,
          password: "wrongpass"
        })
        .then(res => {
          // check to see if response is bad
          expect(res.statusCode).toBe(400);

          // return error message
          expect(res.body.password).toContain("Password incorrect");
        });
    });

    test("User not found", () => {
      expect.assertions(2);

      return request(app)
        .post("/api/users/login")
        .send({
          name: "wronguser",
          password: testpassword
        })
        .then(res => {
          // check to see if response is bad
          expect(res.statusCode).toBe(404);

          // return error message
          expect(res.body.username).toContain("not found");
        });
    });
  });
});
