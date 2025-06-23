// tests/users.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app"); // your Express app
const { User } = require("../db/models/user.model");
const { GoogleUser } = require("../db/models/googleuser.model");

let server;
let mongoServer;
let userId;
let refreshToken;
let accessToken;

beforeAll(async () => {
  // 1) start in-memory mongo
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: "user_test" });

  // 2) start Express on a test port
  server = app.listen(6000);

  // 3) seed one user for login/refresh
  const user = new User({ email: "testuser@example.com", password: "12345678" });
  await user.save();
  userId = user._id.toString();

  refreshToken = await user.createSession();
  accessToken = await user.generateAccessAuthToken();
}, 30000); // give plenty of time for MongoMemoryServer

afterAll(async () => {
  // teardown: clear DB, stop mongoose & server & mongo instance
  await User.deleteMany({});
  await GoogleUser.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise((r) => server.close(r));
}, 20000);

describe("User Auth Routes", () => {
  test("POST /users → create new user + tokens", async () => {
    const res = await request(app)
      .post("/users")
      .send({ email: "new@example.com", password: "abcdefgh" });

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("new@example.com");
    expect(res.headers["x-access-token"]).toBeDefined();
    expect(res.headers["x-refresh-token"]).toBeDefined();
  });

  test("POST /users/login → login + tokens", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ email: "testuser@example.com", password: "12345678" });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  test("GET /users/me/access-token → new access token", async () => {
    const res = await request(app)
      .get("/users/me/access-token")
      .set("x-refresh-token", refreshToken)
      .set("_id", userId);

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test("GET /users/me/token-id → token ID", async () => {
    const res = await request(app)
      .get("/users/me/token-id")
      .set("x-refresh-token", refreshToken)
      .set("_id", userId);

    expect(res.statusCode).toBe(200);
    expect(res.body.tokenId).toBeDefined();
  });

  test("POST /users → duplicate signup rejected", async () => {
    const res = await request(app)
      .post("/users")
      .send({ email: "testuser@example.com", password: "12345678" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/exists/i);
  });
});
