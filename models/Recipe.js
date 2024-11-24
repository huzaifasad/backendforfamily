const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  tags: [String],
  prepTime: { type: Number },
  allergens: [String],
  rating: { type: Number, default: 0 },
  calories: { type: Number },
  ingredients: [String],
  instructions: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Tracks who created the recipe
});

module.exports = mongoose.model("Recipe", RecipeSchema);
