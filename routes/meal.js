const express = require("express");
const Meal = require("../models/Meal");
const Recipe = require("../models/Recipe");
const auth = require("../middleware/auth");

const router = express.Router();

// **Get Weekly Meal Plan**
router.get("/week", auth(["parent"]), async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const meals = await Meal.find({
      user: req.user.id,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).populate("meals.breakfast.recipeId meals.lunch.recipeId meals.dinner.recipeId");

    console.log("Fetched meals:", meals); // Debug log
    res.json(meals);
  } catch (error) {
    console.error("Error fetching weekly meal plan:", error.message);
    res.status(500).json({ message: "Failed to fetch weekly meal plan", error: error.message });
  }
});


// **Add or Update Meal**
router.put("/:date", auth(["parent"]), async (req, res) => {
  const { date } = req.params;
  const { breakfast, lunch, dinner } = req.body;

  try {
    console.log("Incoming meal data:", { breakfast, lunch, dinner }); // Debug log
    const meal = await Meal.findOneAndUpdate(
      { user: req.user.id, date: new Date(date) },
      {
        user: req.user.id,
        date: new Date(date),
        meals: { breakfast, lunch, dinner },
      },
      { upsert: true, new: true }
    );

    console.log("Saved meal:", meal); // Debug log
    res.json({ message: "Meal updated successfully", meal });
  } catch (error) {
    console.error("Error updating meal:", error.message);
    res.status(500).json({ message: "Failed to update meal", error: error.message });
  }
});
// Assuming the meal date is stored as an ISOString in UTC format in the database
const getTodayMeals = async (userId) => {
  // Get the current date in UTC and set the time to 00:00:00 to cover the full day
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);  // Start of today in UTC
  const todayEnd = new Date(todayStart); // Clone the date to set the end of the day
  todayEnd.setUTCHours(23, 59, 59, 999); // End of today in UTC

  console.log("Querying meals from:", todayStart, "to:", todayEnd);

  // Query for meals in the date range for today
  try {
    const meals = await Meal.find({
      date: { $gte: todayStart, $lte: todayEnd },
      user: userId
    });

    if (meals.length === 0) {
      console.log("No meals found for today.");
    } else {
      console.log("Meals for today:", meals);
    }

    return meals;
  } catch (error) {
    console.error("Error fetching meals:", error);
    return [];
  }
};

router.get("/today", auth(["parent"]), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day

    console.log("Fetching meals for today:", today); // Debug log

    const meal = await Meal.findOne({
      user: req.user.id,
      date: today,
    }).populate("meals.breakfast.recipeId meals.lunch.recipeId meals.dinner.recipeId");

    if (!meal) {
      console.log("No meal found for today."); // Debug log
      return res.status(404).json({ message: "No meal found for today" });
    }

    console.log("Fetched today's meal:", meal); // Debug log
    res.json(meal);
  } catch (error) {
    console.error("Error fetching today's meal:", error.message);
    res.status(500).json({ message: "Failed to fetch today's meal", error: error.message });
  }
});

// **Delete Meal**
router.delete("/:date", auth(["parent"]), async (req, res) => {
  const { date } = req.params;

  try {
    const result = await Meal.findOneAndDelete({ user: req.user.id, date });

    if (!result) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res.json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Error deleting meal:", error.message);
    res.status(500).json({ message: "Failed to delete meal", error: error.message });
  }
});

module.exports = router;
