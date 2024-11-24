const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true,  }, // Added `required: true` to ensure it's not missing
  email: { type: String, unique: true, required: true },
  fullName: { type: String }, // Add the fullName field
  subscriptionStatus: { type: String, default: "inactive" }, // active, inactive, expired
  subscriptionPlan: { type: String, default: "free" }, // free, basic, premium
  subscriptionExpiry: { type: Date }, // Expiry date for the subscription
  password: { type: String, required: true },
  role: { type: String, default: "parent" },
  profilePicture: { type: String },
  phoneNumber: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
  },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ["male", "female", "non-binary", "prefer-not-to-say"] },
  maritalStatus: { type: String, enum: ["single", "married", "divorced", "widowed"] },  nationality: { type: String },
  occupation: { type: String },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
  },
  socialMediaLinks: {
    facebook: { type: String },
    twitter: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
  },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Child" }],
});

module.exports = mongoose.model("User", UserSchema);
