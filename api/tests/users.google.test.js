const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const { GoogleUser } = require('../db/models/googleuser.model');

// Mock out google-auth-library
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(({ idToken }) => {
      if (idToken !== 'mocked-id-token') {
        return Promise.reject(new Error('Invalid Google credential'));
      }
      return Promise.resolve({
        getPayload: () => ({
          email: 'googleuser@example.com',
          name: 'Test Google User',
        }),
      });
    }),
  })),
}));

let server;
let mongoServer;

beforeAll(async () => {
  jest.setTimeout(30000);

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'google_test' });
  server = app.listen(5003);
});

afterAll(async () => {
  await GoogleUser.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
  await server.close();
});

describe('Google Sign-In Route', () => {
  it('200 → creates a new GoogleUser and returns tokens', async () => {
    const res = await request(app)
      .post('/users/google-signin')
      .send({ credential: 'mocked-id-token' });

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('googleuser@example.com');
    expect(res.headers['x-access-token']).toBeDefined();
    expect(res.headers['x-refresh-token']).toBeDefined();
  });

  it('200 → returns existing GoogleUser on repeat sign-in', async () => {
    const res = await request(app)
      .post('/users/google-signin')
      .send({ credential: 'mocked-id-token' });

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('googleuser@example.com');
  });

  it('400 → missing credential in body', async () => {
    const res = await request(app)
      .post('/users/google-signin')
      .send({}); // no credential

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/credential is required/i);
  });

  it('400 → invalid token triggers failure path', async () => {
    const res = await request(app)
      .post('/users/google-signin')
      .send({ credential: 'bad-token' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/google sign-in failed/i);
  });
});
