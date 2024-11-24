const mongoose = require("mongoose");

const MealSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  meals: {
    breakfast: {
      recipeName: { type: String },
      recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    },
    lunch: {
      recipeName: { type: String },
      recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    },
    dinner: {
      recipeName: { type: String },
      recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    },
  },
});

module.exports = mongoose.model("Meal", MealSchema);
