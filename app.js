//app.js
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const mongoose = require("mongoose");


// for session handling
require("dotenv").config();
const session = require("express-session");

// Load DB config
const connectToDatabase = require("./dbConfig");
connectToDatabase()
  .then(() => {
    console.log("MongoDB connection successful. Starting server...");
    
    // START SERVER ONLY AFTER DB CONNECTS
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  })
  .catch((err) => {
    // If connection fails, log and exit
    console.error("FATAL: Failed to start server due to MongoDB connection error:", err.message);
    process.exit(1);
  });


// Import models
const { Admin } = require("./models/adminModel");
const { User } = require("./models/userModel");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectToDatabase();


// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
//app.use(fileUpload());
app.use('/css', express.static(__dirname + '/public/css'));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Middleware
app.use(express.static(path.join(__dirname, "public"))); 

//session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
  })
);

// Modular Routes
app.use("/admin", require("./routes/adminRoute"));
app.use("/user", require("./routes/userRoute"));

const authRoutes = require("./routes/authRoute");
app.use("/auth", authRoutes);

const flashCards = require('./routes/flashCards');
app.use('/flashcards', flashCards);

const games = require('./routes/games');
app.use('/games', games);

//Redirecting to index page
app.get("/", async (req, res) => {
  try {
      res.render("home");
  } catch (error) {
    res.status(500).send("Error loading homepage");
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


/*app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);
  res.status(500).send("Something broke! Check the console for error details.");
});*/
