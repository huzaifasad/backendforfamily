const mongoose = require("mongoose");

const ShoppingItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  notes: { type: String },
  cost: { type: Number, required: true },
  purchased: { type: Boolean, default: false },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }, // Link to Transaction
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("ShoppingItem", ShoppingItemSchema);
