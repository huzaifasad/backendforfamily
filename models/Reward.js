const mongoose = require('mongoose');

// Reward Schema (Tracks Rewards Earned by a Child)
const RewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Task Completion Reward",
  },
  description: {
    type: String,
    default: "Reward for completing tasks.",
  },
  points: { type: Number, required: true },
  redeemed: { type: Boolean, default: false },
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
}, { timestamps: true });

// Predefined Reward Schema (Rewards Children Can Redeem)
const PredefinedRewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  pointsRequired: { type: Number, required: true },
});

module.exports = {
  Reward: mongoose.model('Reward', RewardSchema),
  PredefinedReward: mongoose.model('PredefinedReward', PredefinedRewardSchema),
};
