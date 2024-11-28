const express = require('express');
const { Reward, PredefinedReward } = require('../models/Reward');
const Child = require('../models/Child');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();
const childAuth = auth(['child']);

// Add Reward for a Child
// Get Total Points for a Child (Aggregated from Rewards)
router.get('/:childId/points', auth(['parent', 'admin'], true), async (req, res) => {
  try {
    const childId = req.params.childId;

    // Aggregate points from the Reward collection
    const totalPoints = await Reward.aggregate([
      { $match: { child: mongoose.Types.ObjectId(childId) } },
      { $group: { _id: '$child', totalPoints: { $sum: '$points' } } },
    ]);

    if (totalPoints.length === 0) {
      return res.status(404).json({ message: 'No rewards found for this child' });
    }

    // Send the total points in the response
    res.status(200).json({ points: totalPoints[0].totalPoints });
  } catch (error) {
    console.error("Error fetching child points:", error.message);
    res.status(500).json({ message: 'Failed to fetch child points', error: error.message });
  }
});

router.post('/add', auth(['parent'], true), async (req, res) => {
  const { title, description, points, childId } = req.body;
  console.log('Request Body:', req.body); // Log incoming data
  console.log('We are in add reward'); // Debug log

  try {
    // Fetch child based on childId
    const child = await Child.findById(childId);
    
    // If child is not found, return 404
    if (!child) {
      console.log('Child not found'); // Debug log
      return res.status(404).json({ message: 'Child not found' });
    }

    // Print child's name after fetching
    console.log(`Found child: ${child.name}`);  // Log the child's name
    
    // Ensure the parent is the one making the request
    if (child.parent.toString() !== req.user.id) {
      console.log('Unauthorized request'); // Debug log
      return res.status(403).json({ message: 'Unauthorized to add rewards for this child' });
    }

    // Create and save the reward
    const reward = new Reward({
      title,
      description,
      points,
      child: childId,
    });

    await reward.save();
    console.log('Reward saved:', reward); // Log the saved reward
    
    // Send a success response
    res.status(201).json({ message: 'Reward added successfully', reward });
  } catch (error) {
    console.error('Error adding reward:', error.message); // Log the error
    res.status(500).json({ error: error.message });
  }
});



// Get Rewards for a Child
router.get('/:childId', auth(['parent'],true), async (req, res) => {
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
router.put('/edit/:rewardId', auth(['parent'],true), async (req, res) => {
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
router.put('/:rewardId/redeem', auth(['parent'],true), async (req, res) => {
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
router.post('/predefined/redeem', auth(['parent'], true), async (req, res) => {
  const { rewardId, childId } = req.body;

  try {
    const reward = await PredefinedReward.findById(rewardId);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ message: 'Child not found' });

    if (child.points < reward.pointsRequired) {
      return res.status(400).json({ message: 'Not enough points to redeem this reward' });
    }

    // Deduct points and save the child
    child.points -= reward.pointsRequired;
    await child.save();

    // Log the redeemed reward for the child
    const redeemedReward = new Reward({
      title: reward.title,
      description: reward.description,
      points: reward.pointsRequired,
      child: childId,
    });

    await redeemedReward.save();

    res.status(200).json({ message: 'Reward redeemed successfully', reward: redeemedReward });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ message: 'Failed to redeem reward', error: error.message });
  }
});

// Add Predefined Rewards (Admin or System Action)
router.post('/predefined/add', auth(['admin'], true), async (req, res) => {
  const { title, description, pointsRequired } = req.body;
  try {
    const predefinedReward = new PredefinedReward({ title, description, pointsRequired });
    await predefinedReward.save();
    res.status(201).json({ message: 'Predefined reward added successfully', predefinedReward });
  } catch (error) {
    console.error('Error adding predefined reward:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get Predefined Rewards (Available for Children)
router.get('/predefined/list', auth(['parent', 'admin'], true), async (req, res) => {
  try {
    const predefinedRewards = await PredefinedReward.find();
    res.status(200).json(predefinedRewards);
  } catch (error) {
    console.error('Error fetching predefined rewards:', error.message);
    res.status(500).json({ message: 'Failed to fetch predefined rewards', error: error.message });
  }
});

// Redeem a Predefined Reward
router.post('/:childId/redeem', auth(['parent'], true), async (req, res) => {
  const { rewardId } = req.body; // Predefined Reward ID
  const { childId } = req.params;

  try {
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ message: 'Child not found' });

    if (child.parent.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized to redeem rewards for this child' });

    const predefinedReward = await PredefinedReward.findById(rewardId);
    if (!predefinedReward) return res.status(404).json({ message: 'Predefined reward not found' });

    const childRewardPoints = await Reward.aggregate([
      { $match: { child: mongoose.Types.ObjectId(childId) } },
      { $group: { _id: '$child', totalPoints: { $sum: '$points' } } },
    ]);

    const availablePoints = childRewardPoints[0]?.totalPoints || 0;

    if (availablePoints < predefinedReward.pointsRequired) {
      return res.status(400).json({
        message: `Not enough points. ${predefinedReward.pointsRequired} required, but only ${availablePoints} available.`,
      });
    }

    // Deduct points by creating a negative reward
    const reward = new Reward({
      title: `Redeemed: ${predefinedReward.title}`,
      description: `Redeemed for ${predefinedReward.pointsRequired} points.`,
      points: -predefinedReward.pointsRequired,
      child: childId,
    });

    await reward.save();
    res.status(200).json({ message: 'Reward redeemed successfully', reward });
  } catch (error) {
    console.error('Error redeeming reward:', error.message);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
