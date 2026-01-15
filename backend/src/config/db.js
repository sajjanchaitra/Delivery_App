const mongoose = require("mongoose");

const connectMongo = async () => {
  try {
    // Use MONGODB_URI from .env file
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error("❌ MONGODB_URI is not defined in .env file");
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log("MongoDB Atlas Connected Successfully 🚀");
  } catch (error) {
    console.error("MongoDB Connection Failed ❌", error.message);
    process.exit(1);
  }
};

module.exports = connectMongo;