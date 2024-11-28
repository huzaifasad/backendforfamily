const express = require("express");
const router = express.Router();

// Import Models
const User = require("../models/User");
const Child = require("../models/Child");
const Task = require("../models/Task");
const Transaction = require("../models/Transaction");

// Fetch all users with their details (excludes password for security)
router.get("/users", async (req, res) => {
  try {
    console.log("Fetching all users...");
    const users = await User.find().populate("children");
    console.log(`Fetched ${users.length} users.`);
    // console.log(users)
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: error.message });
  }
});
// Fetch subscription details for a specific user
router.get("/users/:id/subscription", async (req, res) => {
  try {
    console.log(`Fetching subscription details for user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).select("subscriptionPlan subscriptionStatus subscriptionExpiry");
    if (!user) {
      console.log(`User with ID ${req.params.id} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Fetched subscription details for user with ID ${req.params.id}`);
    res.json({
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
    });
  } catch (error) {
    console.error(`Error fetching subscription details for user ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch analytics data
router.get("/analytics", async (req, res) => {
  try {
    console.log("Fetching analytics...");

    // Get total number of users
    const totalUsers = await User.countDocuments();

    // Get active users (example: active if last login is within the last 30 days)
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
    });

    // Get total number of premium users (example: subscriptionStatus is "premium")
    const premiumUsers = await User.countDocuments({
      subscriptionStatus: "premium",
    });

    // Get total revenue (aggregate the sum of all transaction amounts)
    const totalRevenueData = await Transaction.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;

    // Get recent transactions (limit to the most recent 10 transactions)
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })  // Sort by most recent first
      .limit(10);

    // Prepare response data
    const analytics = {
      totalUsers,
      activeUsers,
      premiumUsers,
      totalRevenue,
      recentTransactions,
    };

    console.log("Analytics fetched successfully.");
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch a specific user's full details (including children, tasks, transactions)
router.get("/users/:id", async (req, res) => {
  try {
    console.log(`Fetching details for user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id)
      .populate("children")
      .populate("tasks")
      .populate("transactions");

    if (!user) {
      console.log(`User with ID ${req.params.id} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Fetched details for user: ${user.username}`);
    res.json(user);
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update user details (Including plan, subscription, etc.)
router.put("/users/:id", async (req, res) => {
  try {
    console.log(`Updating user with ID: ${req.params.id}`);
    const { username, email, subscriptionPlan, subscriptionStatus, subscriptionExpiry, phoneNumber, fullName, profilePicture } = req.body;

    let updateData = { username, email, subscriptionPlan, subscriptionStatus, subscriptionExpiry, phoneNumber, fullName, profilePicture };

    if (req.body.password) {
      updateData.password = req.body.password;
      console.log("Password included in the update.");
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedUser) {
      console.log(`User with ID ${req.params.id} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User with ID ${req.params.id} updated successfully.`);
    res.json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete a user and all associated data (children, tasks, transactions)
router.delete("/users/:id", async (req, res) => {
  try {
    console.log(`Deleting user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log(`User with ID ${req.params.id} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    await Task.deleteMany({ user: user._id });
    await Child.deleteMany({ parent: user._id });
    await Transaction.deleteMany({ user: user._id });

    await User.findByIdAndDelete(req.params.id);
    console.log(`User with ID ${req.params.id} and associated data deleted successfully.`);
    res.json({ message: "User and all related data deleted successfully" });
  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch all children for a specific user
router.get("/users/:id/children", async (req, res) => {
  try {
    console.log(`Fetching children for user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log(`User with ID ${req.params.id} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    const children = await Child.find({ parent: user._id }).populate("parent");
    console.log(`Fetched ${children.length} children for user: ${user.username}`);
    res.json(children);
  } catch (error) {
    console.error(`Error fetching children for user ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Remove a child from a user and delete associated data (tasks, etc.)
router.delete("/users/:userId/children/:childId", async (req, res) => {
  try {
    console.log(`Removing child with ID ${req.params.childId} from user with ID ${req.params.userId}`);
    const user = await User.findById(req.params.userId);
    if (!user) {
      console.log(`User with ID ${req.params.userId} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    const child = await Child.findById(req.params.childId);
    if (!child || child.parent.toString() !== user._id.toString()) {
      console.log(`Child with ID ${req.params.childId} not found for this user.`);
      return res.status(404).json({ message: "Child not found for this user" });
    }

    await Task.deleteMany({ child: child._id });
    await Child.findByIdAndDelete(child._id);

    console.log(`Child with ID ${req.params.childId} removed successfully from user ${user.username}`);
    res.json({ message: "Child removed successfully from user" });
  } catch (error) {
    console.error(`Error removing child from user ${req.params.userId}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch subscription details for a specific user
router.get("/users/:id/subscription", async (req, res) => {
  try {
    console.log(`Fetching subscription details for user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id).select("subscriptionPlan subscriptionStatus subscriptionExpiry");
    if (!user) {
      console.log(`User with ID ${req.params.id} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Fetched subscription details for user with ID ${req.params.id}`);
    res.json(user);
  } catch (error) {
    console.error(`Error fetching subscription details for user ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update subscription plan for a user
router.put("/users/:id/subscription", async (req, res) => {
  try {
    console.log(`Updating subscription for user with ID: ${req.params.id}`);
    const { subscriptionPlan, subscriptionStatus, subscriptionExpiry } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { subscriptionPlan, subscriptionStatus, subscriptionExpiry },
      { new: true }
    );
    if (!user) {
      console.log(`User with ID ${req.params.id} not found.`);
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Updated subscription for user with ID ${req.params.id}`);
    res.json(user);
  } catch (error) {
    console.error(`Error updating subscription for user ${req.params.id}:`, error.message);
    res.status(400).json({ error: error.message });
  }
});

// Fetch all transactions for a specific user
router.get("/users/:id/transactions", async (req, res) => {
  try {
    console.log(`Fetching transactions for user with ID: ${req.params.id}`);
    const transactions = await Transaction.find({ user: req.params.id });
    console.log(`Fetched ${transactions.length} transactions for user with ID ${req.params.id}`);
    res.json(transactions);
  } catch (error) {
    console.error(`Error fetching transactions for user ${req.params.id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add a new transaction for a user
router.post("/users/:id/transactions", async (req, res) => {
  try {
    console.log(`Adding a new transaction for user with ID: ${req.params.id}`);
    const { type, category, amount, description, relatedItems } = req.body;
    const newTransaction = new Transaction({
      type,
      category,
      amount,
      description,
      relatedItems,
      user: req.params.id,
    });
    await newTransaction.save();

    console.log(`Added a new transaction for user with ID: ${req.params.id}`);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error(`Error adding transaction for user ${req.params.id}:`, error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
