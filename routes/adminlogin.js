const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Secret key for JWT (store this securely in your environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Admin Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists and is an admin
    const adminUser = await User.findOne({ email, role: "admin" });

    if (!adminUser) {
      return res.status(401).json({ message: "Invalid credentials or you are not an admin" });
    }

    // If password check is needed, you would verify the password here
    // Assuming plain text password check for simplicity
    if (adminUser.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT token (expires in 1 hour)
    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role }, // Payload containing admin's ID and role
      JWT_SECRET, // JWT secret key
      { expiresIn: '9999y' } // Set the expiration to an arbitrarily long period (e.g., 9999 years)
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
