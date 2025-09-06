// dbConfig.js

const mongoose = require("mongoose");

const MONGO_URL = "mongodb+srv://angelsmycourses16:angel725@cluster0.51gncrh.mongodb.net/inclusive_resources?retryWrites=true&w=majority&appName=Cluster0";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
};

module.exports = connectToDatabase;
