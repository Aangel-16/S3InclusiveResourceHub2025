//adminModel.js
const mongoose = require('mongoose');

// ========== RESOURCE SCHEMA ==========
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  type: { type: String, enum: ["pdf", "video", "link", "image"], required: true },
  url: { type: String, required: true },
  tags: [{ type: String }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ========== CATEGORY SCHEMA ==========
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" }
});

/* ========== COMMENT SCHEMA ==========
const commentSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});*/

// ========== MODELS ==========
const Resource = mongoose.model("Resource", resourceSchema);
const Category = mongoose.model("Category", categorySchema);
/*const Comment = mongoose.model("Comment", commentSchema);*/

module.exports = { Resource, Category};
