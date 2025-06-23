const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const { User } = require('../db/models/user.model');

let server;
let mongoServer;
let userId;
let refreshToken;

beforeAll(async () => {
  jest.setTimeout(30000);

  // Start new in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'refresh_token_test' });

  // Start Express
  server = app.listen(5004);

  // Create user + session
  const user = new User({ email: 'refresh@example.com', password: '12345678' });
  await user.save();
  userId = user._id.toString();
  refreshToken = await user.createSession();
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
  await server.close();
});

describe('Refresh Token Flow', () => {
  it('200 → issues new access token when refresh token valid', async () => {
    const res = await request(app)
      .get('/users/me/access-token')
      .set('x-refresh-token', refreshToken)
      .set('_id', userId);

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('401 → missing refresh token header', async () => {
    const res = await request(app)
      .get('/users/me/access-token')
      .set('_id', userId);

    expect(res.statusCode).toBe(400);
  });

  it('401 → invalid refresh token', async () => {
    const res = await request(app)
      .get('/users/me/access-token')
      .set('x-refresh-token', 'not-a-valid-token')
      .set('_id', userId);

    expect(res.statusCode).toBe(401);
  });
});
