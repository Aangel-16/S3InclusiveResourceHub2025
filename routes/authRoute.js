const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models/userModel");

// --------------------- LOGIN ---------------------

// Show login form
router.get("/login", (req, res) => {
  res.render("login_signup"); 
});

// Handle login form submission
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("No user found with this email");

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Invalid password");

    // Save user session
      req.session.user = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase()   // normalize
    };

// also set flat values — many routes depend on it
req.session.userId = user._id.toString();
req.session.role = user.role.toLowerCase();


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

// --------------------- SIGNUP ---------------------

// Show signup form
router.get("/signUp", (req, res) => {
  res.render("login_signup");
});

// Handle signup form submission
router.post("/signUp", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).send("All fields are required.");
    }

    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send("User already exists with this email.");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: "teacher" // default role
    });

    await newUser.save();
    console.log("User registered:", newUser);

    res.redirect("/auth/login");

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).send("Error while registering user.");
  }
});

// --------------------- LOGOUT ---------------------

// Show logout confirmation page
router.get("/logout-confirm", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth/login");

  try {
    const user = await User.findById(req.session.user._id);
    res.render("logout", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Perform logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Server error");
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
});

// --------------------- STATIC PAGES ---------------------

router.get("/about", (req, res) => {
  res.render("aboutus"); 
});

router.get("/contact", (req, res) => {
  res.render("contact"); 
});

module.exports = router;
