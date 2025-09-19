//userRoute.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

// Import User model
const User = require("../models/userModel"); 

const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// New user SignUp form
router.get("/signUp", async (req, res) => {
  try {
    res.render("login_signup");
  } catch (err) {
    res.status(500).send("Failed to load form");
  }
});

// Handle New user SignUp form submission
router.post("/signUp", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).send("All fields are required.");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists with this email.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user 
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: "teacher", // default role
    });

    await newUser.save();

    console.log("User registered:", newUser);
    res.redirect("/login_signup"); //  redirect to dashboard
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).send("Error while registering user.");
  }
});


router.get("/userDashboard", (req, res) => {
  res.render("user/userDashboard");
});

router.get("/viewResources", (req, res) => {
  res.render("user/viewResources");
});


router.get("/communityHub", (req, res) => {
  res.render("user/community");
});

//user Views Guidelines
router.get("/viewGuidelines", (req, res) => { //define the route for the corresponding ejs file
  res.render("user/viewGuidelines"); // Mention the ejs file to be rendered
});


module.exports = router;
