const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const { User } = require('../db/models/user.model');
const { List } = require('../db/models/list.model');

let server, mongoServer, accessToken, userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'protected_test' });
  server = app.listen(5005);

  const user = new User({ email: 'protected@example.com', password: '12345678' });
  await user.save();
  userId = user._id.toString();
  accessToken = await user.generateAccessAuthToken();
});

afterAll(async () => {
  await User.deleteMany({});
  await List.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

describe('Protected Route Access', () => {
  test('should allow access with valid token', async () => {
    const res = await request(app)
      .post('/lists')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'My List' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('My List');
  });

  test('should deny access with missing token', async () => {
    const res = await request(app)
      .post('/lists')
      .send({ title: 'Blocked List' });

    expect(res.statusCode).toBe(401);
  });

  test('should deny access with invalid token', async () => {
    const res = await request(app)
      .post('/lists')
      .set('Authorization', 'Bearer invalid.token')
      .send({ title: 'Bad List' });

    expect(res.statusCode).toBe(401);
  });
});
