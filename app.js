console.log("Starting application...");

const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const mongoose = require("mongoose");

// Load DB config
//const connectToDatabase = require("./dbConfig");

// Import models
const { admin } = require("./models/adminModel");
const { user } = require("./models/userModel");

// Import routes - THIS WAS MISSING!
const adminRoutes = require("./routes/adminRoute");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
//connectToDatabase();

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Routes - THIS WAS MISSING!
app.use("/admin", adminRoutes);

// Redirecting to index page
app.get("/", async (req, res) => {
  try {
      res.render("index");
  } catch (error) {
    res.status(500).send("Error loading homepage");
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server - ONLY ONE app.listen()!
console.log("About to start server...");
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}/admin/dashboard`);
});
console.log("Server setup complete");