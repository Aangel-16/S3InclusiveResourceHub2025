//adminRoute
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");


const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//  Admin Dashboard
router.get("/adminDashboard", (req, res) => {
  res.render("admin/adminDashboard");
});


//Manage Users
router.get("/addUser", (req, res) => {
  res.render("admin/addUser");
});

router.post("/addUser", (req, res) => {
  res.render("admin/addUser");
});



// Special Educators - List , Restrict access
router.get("/listEducators", (req, res) => {
  res.render("admin/listEducators");
});


//Resource Library
router.get("/resourceLibrary", (req, res) => {
  res.render("admin/resourceLibrary"); 
});




//Manage content category
router.get("/contentCategory", async (req, res) => {
  res.render("admin/contentCategory");
});


//Export the router
module.exports = router;  
