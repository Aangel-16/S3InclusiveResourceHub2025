//This page hanldes common login function for admin and regular user

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

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

module.exports = router;
