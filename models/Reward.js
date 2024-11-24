const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Task Completion Reward", // Default title
  },
  description: {
    type: String,
    default: "Reward for completing tasks.", // Default description
  },
  points: { type: Number, required: true },
  redeemed: { type: Boolean, default: false },
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Reward', RewardSchema);
