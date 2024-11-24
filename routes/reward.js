const express = require('express');
const Reward = require('../models/Reward');
const Child = require('../models/Child');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Add Reward for a Child
router.post('/add', auth(['parent']), async (req, res) => {
  const { title, description, points, childId } = req.body;
  console.log('Request Body:', req.body); // Log incoming data
  console.log('we are in add reward'); // Debug log
  try {
    const child = await Child.findById(childId);
    if (!child) {
      console.log('Child not found'); // Debug log
      return res.status(404).json({ message: 'Child not found' });
    }

    if (child.parent.toString() !== req.user.id) {
      console.log('Unauthorized request'); // Debug log
      return res.status(403).json({ message: 'Unauthorized to add rewards for this child' });
    }

    const reward = new Reward({
      title,
      description,
      points,
      child: childId,
    });

    await reward.save();
    console.log('Reward saved:', reward); // Log the saved reward
    res.status(201).json({ message: 'Reward added successfully', reward });
  } catch (error) {
    console.error('Error adding reward:', error.message); // Log the error
    res.status(500).json({ error: error.message });
  }
});


// Get Rewards for a Child
router.get('/:childId', auth(['parent']), async (req, res) => {
  try {
    console.log("Child ID:", req.params.childId); // Debug log
    const rewards = await Reward.find({ child: req.params.childId });
    console.log("Rewards Found:", rewards); // Debug log
    res.json(rewards);
  } catch (error) {
    console.error("Error fetching rewards:", error.message); // Debug log
    res.status(500).json({ message: 'Failed to fetch rewards', error: error.message });
  }
});


// Edit Reward
router.put('/edit/:rewardId', auth(['parent']), async (req, res) => {
  const { title, description, points } = req.body;
  const { rewardId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(rewardId)) {
    return res.status(400).json({ message: 'Invalid Reward ID' });
  }
  try {
    const reward = await Reward.findById(req.params.rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    reward.title = title || reward.title;
    reward.description = description || reward.description;
    reward.points = points !== undefined ? points : reward.points;

    await reward.save();

    res.status(200).json({ message: 'Reward updated successfully', reward });
  } catch (error) {
    console.error('Error updating reward:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Redeem Reward
router.put('/:rewardId/redeem', auth(['parent']), async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    reward.redeemed = true;
    await reward.save();

    res.status(200).json({ message: 'Reward redeemed successfully', reward });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
