//This page hanldes common login and logout function for admin and regular user

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {User} = require("../models/userModel");

// Show login form
router.get("/login", (req, res) => {
  res.render("login_signup"); 
});

// Handle login form
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("No user found with this email");
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid password");
    }

    // After verifying password
      req.session.userId = user._id;
      req.session.role = user.role;

    // Redirect based on role
    if (user.role === "admin") {
      return res.redirect("/admin/adminDashboard");
    } else {
      return res.redirect("/user/userDashboard");
    }

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});


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
    res.redirect("/auth/login"); //  redirect to dashboard
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).send("Error while registering user.");
  }
});


// Show logout confirmation page
router.get("/logout-confirm", async (req, res) => {
  if (!req.session.userId) return res.redirect("/auth/login");

  try {
    const user = await User.findById(req.session.userId);
    res.render("logout", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Actual logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Server error");
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
});

router.get("/about", (req, res) => {
  res.render("aboutus"); 
});

router.get("/contact", (req, res) => {
  res.render("contact"); 
});
module.exports = router;
