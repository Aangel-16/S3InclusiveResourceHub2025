//adminModel.js
const mongoose = require('mongoose');

// ========== RESOURCE SCHEMA ==========
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  type: { type: String, enum: ["pdf", "video", "link", "image"], required: true },
  url: { type: String, required: false },
  bgimage:{ type: String, default: "" },
  tags: [{ type: String }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Category", 
        required: true 
    },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ========== CATEGORY SCHEMA ==========
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" }
});

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  replies: [
    {
      text: String,
      repliedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
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
const Reply = mongoose.model("Reply", replySchema);
/*const Comment = mongoose.model("Comment", commentSchema);*/

module.exports = { Resource, Category, Reply /*, Comment*/ };
