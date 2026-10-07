const path = require("node:path");
const { after, before } = require("node:test");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

before(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be set in the backend .env file to run tests");
  }

  await mongoose.connect(process.env.MONGO_URI);
});

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
