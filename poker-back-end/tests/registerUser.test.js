const app = require("../app");
const request = require("supertest");

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

/**  
  Client browser hits api/users/register with POST requets and form filled with a username, password and password 2. API returns user profile
**/
describe("Test register route", () => {
  test("It should respond with valid POST method", () => {
    expect.assertions(2);
    return request(app)
      .post("/api/users/register")
      .send({
        name: "Test User",
        email: "test@test.com",
        password: "password",
        password2: "password"
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
          name: "Test User",
          email: "test@test.com",
          password: "password",
          password2: "password"
        });
      });
  });
});

/**  
  Client browser hits api/users/register with POST requets and form filled with special char username, password or password 2. API returns error
**/

/**  
  Client browser hits api/users/register with POST requets and form filled with a mismatched password and password 2. API returns error.
**/

/**  
  Client browser hits api/users/register with POST requets and form filled with a preexisting username. API returns error.
**/
