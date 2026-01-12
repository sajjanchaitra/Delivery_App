const mongoose = require("mongoose");

const connectMongo = async () => {
  try {
    await mongoose.connect("mongodb+srv://Naimo:RUOzNB1vSPK4XgkG@cluster0.zd1zrhk.mongodb.net/?appName=Cluster0");
    console.log("MongoDB Atlas Connected Successfully 🚀");
  } catch (error) {
    console.error("MongoDB Connection Failed ❌", error.message);
    process.exit(1);
  }
};

module.exports = connectMongo;
