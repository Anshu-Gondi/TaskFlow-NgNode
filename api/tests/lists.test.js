const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app'); // Ensure this exports the Express app without calling app.listen()

const { List } = require('../db/models/list.model');

// Mock user ID and JWT
const userId = new mongoose.Types.ObjectId();
const token = jwt.sign({ _id: userId }, process.env.JWT_SECRET || 'testsecret');

jest.setTimeout(30000); // 30 seconds

describe('List Routes', () => {
    let mongoServer;

    beforeAll(async () => {
        try {
            mongoServer = await MongoMemoryServer.create();
            await mongoose.connect(mongoServer.getUri(), { dbName: "verifyTEST" });
        } catch (err) {
            console.error("MongoMemoryServer failed to start:", err);
        }
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        await List.deleteMany({});
    });

    describe('GET /lists', () => {
        it('should return all lists for the authenticated user', async () => {
            await List.create([{ title: 'Test List', _userId: userId }]);

            const res = await request(app)
                .get('/lists')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Test List');
        });
    });

    describe('POST /lists', () => {
        it('should create a new list', async () => {
            const res = await request(app)
                .post('/lists')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'New List' });

            expect(res.status).toBe(201);
            expect(res.body.title).toBe('New List');
            expect(res.body._userId).toBe(userId.toHexString());
        });
    });

    describe('PATCH /lists/:id', () => {
        it('should update an existing list', async () => {
            const list = await List.create({ title: 'Old Title', _userId: userId });

            const res = await request(app)
                .patch(`/lists/${list._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Title' });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Updated Title');
        });

        it('should return 404 if list not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .patch(`/lists/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Nope' });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /lists/:id', () => {
        it('should delete an existing list', async () => {
            const list = await List.create({ title: 'Delete Me', _userId: userId });

            const res = await request(app)
                .delete(`/lists/${list._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);

            const inDb = await List.findById(list._id);
            expect(inDb).toBeNull();
        });

        it('should return 404 if list does not exist', async () => {
            const res = await request(app)
                .delete(`/lists/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });
});
