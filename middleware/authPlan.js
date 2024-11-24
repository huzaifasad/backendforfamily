const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authWithPlan = (allowedRoles = [], requireSubscription = false) => async (req, res, next) => {
  console.log("Entering authWithPlan middleware for route:", req.originalUrl);

  const token = req.header("Authorization")?.split(" ")[1]; // Extract Bearer token

  if (!token) {
    console.error("Auth Error: No token provided.");
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded);

    // Fetch the user from the database
    const user = await User.findById(decoded.id);
    if (!user) {
      console.error("Auth Error: User not found with ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User found:", user);

    // Check for role-based access
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      console.error(
        "Auth Error: Insufficient permissions. Required roles:",
        allowedRoles,
        "User role:",
        user.role
      );
      return res.status(403).json({ message: "Access forbidden: insufficient permissions" });
    }
    console.log("Role validation passed for user:", user.role);

    // If subscription validation is required, check subscription status and expiry
    if (requireSubscription) {
      console.log("Checking subscription for user:", user.email);

      if (user.subscriptionStatus !== "active") {
        console.error("Auth Error: Subscription is not active. Status:", user.subscriptionStatus);
        return res.status(403).json({
          message: "Subscription required to access this resource.",
        });
      }

      if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
        console.error(
          "Auth Error: Subscription expired. Expiry date:",
          user.subscriptionExpiry
        );
        return res.status(403).json({
          message: "Subscription expired. Please renew your plan.",
        });
      }

      console.log("Subscription validation passed for user:", user.email);
    }

    // Attach the user object to the request for further use
    req.user = user;

    // Proceed to the next middleware or route
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(401).json({ message: "Invalid token or authentication failed" });
  }
};

module.exports = authWithPlan;
