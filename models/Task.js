const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    status: { type: String, enum: ['to-do', 'in-progress', 'done'], default: 'to-do' },
    recurrence: { type: String, enum: ['daily', 'weekly', 'monthly', 'none'], default: 'none' }, // Recurrence
    dueDate: { type: Date }, // Optional due date
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    comments: [
      {
        type: String,
        trim: true,
        minlength: 1,
        maxlength: 200,
      },
    ],
    attachments: [{ type: String }], // URLs to attachments
    completedAt: { type: Date }, // Timestamp for completion
    reward: { // Reward field for the task
      points: { type: Number, default: 0 }, // Points for completing the task
      predefinedReward: { type: mongoose.Schema.Types.ObjectId, ref: 'PredefinedReward' }, // Reference to predefined rewards
    },
    lateDays: { type: Number, default: 0 }, // Days late
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
