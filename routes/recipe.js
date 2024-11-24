const express = require("express");
const Recipe = require("../models/Recipe");
const auth = require("../middleware/auth");

const router = express.Router();

// **Get All Recipes**
router.get("/", auth(["parent"]), async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error.message);
    res.status(500).json({ message: "Failed to fetch recipes", error: error.message });
  }
});

// **Add New Recipe**
router.post("/", auth(["parent"]), async (req, res) => {
  const { name, image, tags, prepTime, allergens, rating, calories, ingredients, instructions } = req.body;

  try {
    const recipe = new Recipe({
      name,
      image,
      tags,
      prepTime,
      allergens,
      rating,
      calories,
      ingredients,
      instructions,
      createdBy: req.user.id,
    });

    await recipe.save();

    res.status(201).json({ message: "Recipe added successfully", recipe });
  } catch (error) {
    console.error("Error adding recipe:", error.message);
    res.status(500).json({ message: "Failed to add recipe", error: error.message });
  }
});

// **Update Recipe**
router.put("/:id", auth(["parent"]), async (req, res) => {
  const { name, image, tags, prepTime, allergens, rating, calories, ingredients, instructions } = req.body;

  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { name, image, tags, prepTime, allergens, rating, calories, ingredients, instructions },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({ message: "Recipe updated successfully", recipe });
  } catch (error) {
    console.error("Error updating recipe:", error.message);
    res.status(500).json({ message: "Failed to update recipe", error: error.message });
  }
});

// **Delete Recipe**
router.delete("/:id", auth(["parent"]), async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error.message);
    res.status(500).json({ message: "Failed to delete recipe", error: error.message });
  }
});

module.exports = router;
