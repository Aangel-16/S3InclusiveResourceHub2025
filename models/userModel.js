
// models/userModel.js
const mongoose = require("mongoose");

// ========== NEW USER SCHEMA ==========
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


// ========== COMMENT SCHEMA ==========
const commentSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ========== COMMUNITY POST SCHEMA ==========
const communityPostSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  replies: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

// ========== MODELS ==========
const User = mongoose.model("User", userSchema,"users");
const Comment = mongoose.model("UserComment", commentSchema);
const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);

module.exports = { User, Comment, CommunityPost };
