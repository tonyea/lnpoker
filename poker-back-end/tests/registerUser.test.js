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
  describe("Test register route", () => {
    const testusername = "testees";

    test("It should respond with valid POST method", () => {
      expect.assertions(2);
      return request(app)
        .post("/api/users/register")
        .send({
          name: testusername,
          password: "password",
          password2: "password"
        })
        .then(res => {
          // check to see if response is ok
          expect(res.statusCode).toBe(200);

          // check to see if profiled data is returned
          expect(res.body).toEqual(
            expect.objectContaining({
              name: testusername,
              password: "password"
            })
          );
          // console.log(res.body);
        });
    });

    // check to see if profile data is persisted to DB
    test("DB should have persisted user", () => {
      expect.assertions(1);
      return User.findOne({ name: testusername })
        .then(user => {
          expect(user.name).toEqual(testusername);
        })
        .catch(err => console.log(err));
    });
  });

  // Client browser hits api/users/register with POST requets and form filled with special char username, password or password 2. API returns error

  // Check that the password is hashed

  //  Client browser hits api/users/register with POST requets and form filled with a mismatched password and password 2. API returns error.

  //  Client browser hits api/users/register with POST requets and form filled with a preexisting username. API returns error.
});
