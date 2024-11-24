const express = require("express");
const router = express.Router();
const ShoppingItem = require("../models/ShoppingItem");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");

// ===========================
// Shopping Items Management
// ===========================

// Add a shopping item (creates a linked transaction)
router.post("/shopping-items", auth(['parent'],true), async (req, res) => {
  try {
    const { name, category, priority, notes, cost } = req.body;

    if (!name || !category || !cost) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create the shopping item
    const shoppingItem = await ShoppingItem.create({
      name,
      category,
      priority: priority || "Medium",
      notes,
      cost,
      user: req.user.id,
    });

    // Create a corresponding expense transaction
    const transaction = await Transaction.create({
      type: "expense",
      category,
      amount: cost,
      description: `Shopping: ${name}`,
      user: req.user.id,
      relatedItems: [shoppingItem._id],
    });

    // Link the transaction to the shopping item
    shoppingItem.transaction = transaction._id;
    await shoppingItem.save();

    res.status(201).json({ message: "Shopping item added successfully", shoppingItem, transaction });
  } catch (error) {
    console.error("Error adding shopping item:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get all shopping items for the user
router.get("/shopping-items", auth(['parent'],true), async (req, res) => {
  try {
    const shoppingItems = await ShoppingItem.find({ user: req.user.id }).populate("transaction");
    res.status(200).json(shoppingItems);
  } catch (error) {
    console.error("Error fetching shopping items:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Update a shopping item
router.put("/shopping-items/:id", auth(['parent'],true), async (req, res) => {
  try {
    const shoppingItem = await ShoppingItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!shoppingItem) {
      return res.status(404).json({ message: "Shopping item not found" });
    }

    // Update linked transaction if cost or category changes
    if (req.body.cost || req.body.category) {
      await Transaction.findByIdAndUpdate(
        shoppingItem.transaction,
        {
          amount: req.body.cost || shoppingItem.cost,
          category: req.body.category || shoppingItem.category,
        },
        { new: true }
      );
    }

    res.status(200).json({ message: "Shopping item updated", shoppingItem });
  } catch (error) {
    console.error("Error updating shopping item:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Delete a shopping item (also deletes linked transaction)
router.delete("/shopping-items/:id", auth(['parent'],true), async (req, res) => {
  try {
    const shoppingItem = await ShoppingItem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!shoppingItem) {
      return res.status(404).json({ message: "Shopping item not found" });
    }

    // Delete linked transaction
    await Transaction.findByIdAndDelete(shoppingItem.transaction);

    res.status(200).json({ message: "Shopping item and linked transaction deleted" });
  } catch (error) {
    console.error("Error deleting shopping item:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// =======================
// Transaction Management
// =======================

// Add a transaction
router.post("/transactions", auth(['parent'],true), async (req, res) => {
  try {
    const { type, category, amount, description } = req.body;

    if (!type || !category || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = await Transaction.create({
      type,
      category,
      amount,
      description,
      user: req.user.id,
    });

    res.status(201).json({ message: "Transaction added successfully", transaction });
  } catch (error) {
    console.error("Error adding transaction:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get all transactions for the user
router.get("/transactions", auth(['parent'],true), async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).populate("relatedItems");
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Update a transaction
router.put("/transactions/:id", auth(['parent'],true), async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json({ message: "Transaction updated", transaction });
  } catch (error) {
    console.error("Error updating transaction:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Delete a transaction
router.delete("/transactions/:id", auth(['parent'],true), async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Unlink related shopping items
    await ShoppingItem.updateMany({ transaction: transaction._id }, { $unset: { transaction: "" } });

    res.status(200).json({ message: "Transaction and related items unlinked" });
  } catch (error) {
    console.error("Error deleting transaction:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// =======================
// Budget Summary
// =======================

// Get user's budget summary
router.get("/summary", auth(['parent'],true), async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      income,
      expenses,
      balance: income - expenses,
    });
  } catch (error) {
    console.error("Error fetching budget summary:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
