const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
    {
        content: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
        priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
        status: { type: String, enum: ['to-do', 'in-progress', 'done'], default: 'to-do' },
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
    },
    { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);
