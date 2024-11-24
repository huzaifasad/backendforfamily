const mongoose = require('mongoose');

const ChildSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Plain text password for simplicity
  dob: { type: Date, required: true },
  grade: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the parent
  parentUsername: { type: String, required: true }, // Stores the parent's username
  profilePicture: { type: String }, // URL or path for profile picture
  role: { type: String, default: 'child' }, // Always "child"
}, { timestamps: true });

module.exports = mongoose.model('Child', ChildSchema);
