
// models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["teacher", "admin"], default: "teacher" },
  phone: { type: String, required: true, trim: true },
  profile: {
    photo: { type: String, default: "" },
    bio: { type: String, default: "" }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Export model
const User = mongoose.model("User", userSchema,"users");
module.exports = User;
