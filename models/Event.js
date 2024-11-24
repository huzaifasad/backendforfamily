const mongoose = require("mongoose");

// Define Event Schema
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Event title
  description: { type: String }, // Event description
  date: { type: String, required: true }, // Event date in "YYYY-MM-DD" format
  startTime: { type: String, required: true }, // Start time in "HH:mm" format
  endTime: { type: String, required: true }, // End time in "HH:mm" format
  category: { type: String, required: true }, // Event category (e.g., school, sports)
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
});

// Export Event Model
module.exports = mongoose.model("Event", EventSchema);
