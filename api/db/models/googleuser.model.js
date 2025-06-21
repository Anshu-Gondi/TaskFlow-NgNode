const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || "Vw7!yA@9hZ#5$dBmN3%xT&JpQ6^rEk*Lf";
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_EXPIRY_DAYS) || 10;

const GoogleUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },

    sessions: [{
        token: {
            type: String,
            required: true
        },
        expirytime: {
            type: Number,
            required: true
        }
    }],

    apiKey: {
        type: String,
        unique: true,
        sparse: true // important to avoid indexing error if not generated yet
    }
});

// --------- Instance Methods ---------

// Generate short-lived Access Token (JWT)
GoogleUserSchema.methods.generateAccessAuthToken = function () {
    const user = this;
    return jwt.sign({ _id: user._id.toHexString() }, jwtSecret, { expiresIn: '15m' });
};

// Generate long random refresh/session token
GoogleUserSchema.methods.generateSessionToken = function () {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (!err) resolve(buf.toString('hex'));
            else reject(err);
        });
    });
};

// Generate Refresh Auth Token (wrapper)
GoogleUserSchema.methods.generateRefreshAuthToken = function () {
    return this.generateSessionToken();
};

// Save session to MongoDB
const saveSessionToDatabase = (user, refreshToken) => {
    const expiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
    user.sessions.push({ token: refreshToken, expirytime: expiresAt });
    return user.save().then(() => refreshToken);
};

// Create a new refresh session
GoogleUserSchema.methods.createSession = function () {
    return this.generateRefreshAuthToken()
        .then((refreshToken) => saveSessionToDatabase(this, refreshToken))
        .catch((e) => Promise.reject('Session save failed.\n' + e));
};

// Generate API credentials (e.g., for 3rd party usage)
GoogleUserSchema.methods.generateCredentials = function () {
    const user = this;
    return new Promise((resolve, reject) => {
        crypto.randomBytes(32, (err, buf) => {
            if (!err) {
                const apiKey = buf.toString('hex');
                user.apiKey = apiKey;
                user.save().then(() => resolve(apiKey)).catch(reject);
            } else {
                reject(err);
            }
        });
    });
};

// --------- Static Methods ---------

// Lookup by ID and refresh token
GoogleUserSchema.statics.findByIdAndToken = function (id, token) {
    return this.findOne({ _id: id, 'sessions.token': token });
};

// Check if refresh token is expired
GoogleUserSchema.statics.hasRefreshTokenExpired = function (expiryTime) {
    return expiryTime < Math.floor(Date.now() / 1000);
};

const GoogleUser = mongoose.model('GoogleUser', GoogleUserSchema);
module.exports = { GoogleUser };
