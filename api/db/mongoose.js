const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

// Retrieve the MongoDB URI from .env file
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("MONGO_URI is not defined in .env file");
  process.exit(1);
}

// Connect to MongoDB (Remove deprecated options)
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected successfully to MongoDB!");
  })
  .catch((e) => {
    console.error("Error while attempting to connect to MongoDB:", e);
    process.exit(1);
  });

module.exports = { mongoose };
