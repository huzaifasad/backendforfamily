const express = require('express');
const jwt = require('jsonwebtoken');
const Child = require('../models/Child');
const router = express.Router();

// Child Login Route
router.post('/child/loginx', async (req, res) => {
  const { email, password, parentUsername } = req.body;

  try {
    // Validate required fields
    if (!email || !password || !parentUsername) {
      return res.status(400).json({ message: 'Email, password, and parent username are required.' });
    }

    // Find the child by email and parentUsername
    const child = await Child.findOne({ email, parentUsername });
    if (!child) {
      return res.status(404).json({ message: 'Child or parent username not found.' });
    }

    // Validate password (plain text comparison)
    if (child.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: child._id, role: 'child' }, '123', { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      child: {
        id: child._id,
        name: child.name,
        email: child.email,
        dob: child.dob,
        grade: child.grade,
      },
    });
  } catch (error) {
    console.error('Error during child login:', error.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
