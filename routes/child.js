const express = require('express');
const Child = require('../models/Child');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Add Child
router.post('/add', auth(['parent']), async (req, res) => {
  const { name, email, password, dob, grade } = req.body;

  try {
    const parent = await User.findById(req.user.id);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const existingChild = await Child.findOne({ email });
    if (existingChild) {
      return res.status(400).json({ message: 'Child with this email already exists' });
    }

    const child = new Child({
      name,
      email,
      password,
      dob,
      grade,
      parent: req.user.id,
      parentUsername: parent.username,
    });

    await child.save();
    parent.children.push(child._id);
    await parent.save();

    res.status(201).json({ message: 'Child added successfully', child });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Children for Parent
router.get('/', auth(['parent']), async (req, res) => {
    console.log("GET /children - User ID from token:", req.user?.id); // Log user ID
  
    try {
      const children = await Child.find({ parent: req.user.id });
      console.log("GET /children - Children fetched:", children); // Log fetched children
      res.json(children);
    } catch (error) {
      console.error("GET /children - Failed to fetch children:", error.message);
      res.status(500).json({ message: "Failed to fetch children", error: error.message });
    }
  });
  

module.exports = router;
