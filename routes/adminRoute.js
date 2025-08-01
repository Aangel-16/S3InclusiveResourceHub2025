console.log("📁 adminRoute.js file loading...");

const express = require("express");
const path = require("path");
const router = express.Router();

console.log("✅ adminRoute.js loaded successfully!");

// Simple test route
router.get("/dashboard", (req, res) => {
  console.log("🎯 Dashboard route accessed!");
  res.send(`
    <html>
      <head><title>Admin Dashboard Test</title></head>
      <body>
        <h1>🎉 Success! Admin Dashboard Route Works!</h1>
        <p>Your routing is working correctly.</p>
        <p>File location: routes/adminRoute.js</p>
        <p>Route: /admin/dashboard</p>
      </body>
    </html>
  `);
});

router.get("/", (req, res) => {
  console.log("🏠 Admin root route accessed, redirecting...");
  res.redirect("/admin/dashboard");
});

console.log("📤 Exporting admin router...");
module.exports = router;