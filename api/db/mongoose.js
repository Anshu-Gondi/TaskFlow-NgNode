const mongoose = require("mongoose");
require("dotenv").config({ path: "./api/.env" }); // Load environment variables

// Skip connection if running in test environment (MongoMemoryServer will handle it)
if (process.env.NODE_ENV !== 'test') {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error("MONGO_URI is not defined in .env file");
    process.exit(1);
  }

  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log("Connected successfully to MongoDB!");
    })
    .catch((e) => {
      console.error("Error while attempting to connect to MongoDB:", e);
      process.exit(1);
    });
}

module.exports = { mongoose };
