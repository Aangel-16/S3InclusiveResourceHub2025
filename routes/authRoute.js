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


module.exports = router;
