// ✅ Unit tests for User model methods

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { User } = require('../db/models/user.model');
const jwt = require('jsonwebtoken');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'user_methods_test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Model Methods', () => {
  let user;

  beforeEach(async () => {
    user = new User({ email: 'sessionuser@example.com', password: 'test1234' });
    await user.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test('createSession should generate a refresh token and store in sessions array', async () => {
    const token = await user.createSession();
    expect(typeof token).toBe('string');

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.sessions.length).toBe(1);
    expect(updatedUser.sessions[0].token).toBe(token);
  });

  test('generateAccessAuthToken should return a valid JWT with correct user ID', async () => {
    const accessToken = await user.generateAccessAuthToken();
    const decoded = jwt.decode(accessToken);
    expect(decoded._id).toEqual(user._id.toHexString());
  });
});
