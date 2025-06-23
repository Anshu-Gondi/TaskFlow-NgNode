const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Task } = require('../db/models/task.model');
const { List } = require('../db/models/list.model');
const { User } = require('../db/models/user.model');

let server;
let mongoServer;
let accessToken;
let refreshToken;
let userId;
let listId;
let taskId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'task_test' });

  server = app.listen(5001); // use a test port

  // Create a test user manually
  const user = new User({ email: 'test@example.com', password: '12345678' });
  await user.save();
  userId = user._id.toString();

  refreshToken = await user.createSession();
  accessToken = await user.generateAccessAuthToken();

  // Create a list
  const list = new List({ title: 'Test List', _userId: userId });
  await list.save();
  listId = list._id.toString();
}, 30000); // ⏱️ increase timeout

afterAll(async () => {
  await User.deleteMany({});
  await List.deleteMany({});
  await Task.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();  // ✅ Stop MongoMemoryServer
  await server.close();      // ✅ Close Express server
}, 20000);

describe('Task Routes', () => {
  test('POST /lists/:listId/tasks -> should create task', async () => {
    const res = await request(app)
      .post(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Sample Task' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Sample Task');
    taskId = res.body._id;
  });

  test('GET /lists/:listId/tasks -> should return all tasks for list', async () => {
    const res = await request(app)
      .get(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PATCH /lists/:listId/tasks/:taskId -> should update task', async () => {
    const res = await request(app)
      .patch(`/lists/${listId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.updatedTask.completed).toBe(true);
  });

  test('DELETE /lists/:listId/tasks/:taskId -> should delete task', async () => {
    const res = await request(app)
      .delete(`/lists/${listId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Task deleted successfully');
  });

  test('GET /lists/:listId/tasks -> return 404 if no tasks exist', async () => {
    const res = await request(app)
      .get(`/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
  });
});
