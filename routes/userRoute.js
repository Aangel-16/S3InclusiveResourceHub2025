//userRoute
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");


const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.get("/dashboard", (req, res) => {
  res.render("user/userDashboard");
});

module.exports = router;  