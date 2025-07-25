// hashAdmin.js
const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "admin123"; // your desired default admin password
  const hashed = await bcrypt.hash(password, 10);
  console.log("Hashed Password:", hashed);
}

generateHash();
