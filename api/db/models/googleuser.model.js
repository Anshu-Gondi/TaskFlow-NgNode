const mongoose = require('mongoose');
const crypto = require('crypto');

// JWT Secrets and refresh token expiry
const jwtSecret = process.env.JWT_SECRET || "Vw7!yA@9hZ#5$dBmN3%xT&JpQ6^rEk*Lf";
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_EXPIRY_DAYS) || 10;

// Define the base User schema
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        minlength: 8
    },
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
        unique: true
    }
});

// Method to generate credentials (API key)
UserSchema.methods.generateCredentials = function () {
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

// Add method for generating session token
UserSchema.methods.generateSessionToken = function () {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (!err) {
                let token = buf.toString('hex');
                resolve(token);
            } else {
                reject(err);
            }
        });
    });
};

// Method to generate refresh auth token
UserSchema.methods.generateRefreshAuthToken = function () {
    return this.generateSessionToken().then((refreshToken) => {
        return refreshToken;
    });
};

// Helper to save session to database
let saveSessionToDatabase = (user, refreshToken) => {
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiryTime();
        user.sessions.push({ token: refreshToken, expirytime: expiresAt });

        user.save().then(() => resolve(refreshToken)).catch(reject);
    });
};

// Helper to generate token expiry time
let generateRefreshTokenExpiryTime = () => {
    let secondsUntilExpire = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
    return Math.floor(Date.now() / 1000) + secondsUntilExpire;
};

// Define the GoogleUser schema (inherits UserSchema)
const GoogleUserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    // Add any other fields specific to Google users here
});

// Inherit methods from User schema
GoogleUserSchema.methods.createSession = function () {
    return this.generateRefreshAuthToken()
        .then((refreshToken) => {
            return saveSessionToDatabase(this, refreshToken);
        })
        .then((refreshToken) => refreshToken)
        .catch((e) => {
            return Promise.reject('Failed to save session to database.\n' + e);
        });
};

// Create GoogleUser model with inherited methods
const GoogleUser = mongoose.model('GoogleUser', GoogleUserSchema);

module.exports = { GoogleUser };  // Export GoogleUser model
