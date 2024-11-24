const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = (allowedRoles = [], requireSubscription = false) => async (req, res, next) => {
  console.log("========== Entering Auth Middleware ==========");
  console.log("Route:", req.originalUrl);

  // Extract token from the Authorization header
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    console.error("Auth Error: No token provided.");
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }
  console.log("Token received:", token);

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded);

    // Fetch the user from the database
    const user = await User.findById(decoded.id);
    if (!user) {
      console.error("Auth Error: User not found in the database. User ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
    });

    // Check for role-based access
    if (allowedRoles.length) {
      console.log("Allowed roles for this route:", allowedRoles);
      console.log("User's role:", user.role);

      if (!allowedRoles.includes(user.role)) {
        console.error(
          "Auth Error: Insufficient permissions. Required roles:",
          allowedRoles,
          "User role:",
          user.role
        );
        return res.status(403).json({ message: "Access forbidden: insufficient permissions" });
      }
      console.log("Role validation passed for user:", user.role);
    } else {
      console.log("No role restrictions applied to this route.");
    }

    // If subscription validation is required
    if (requireSubscription) {
      console.log("Subscription validation required for this route.");
      console.log("User's subscription status:", user.subscriptionStatus);

      if (user.subscriptionStatus !== "active") {
        console.error(
          "Auth Error: User does not have an active subscription. Status:",
          user.subscriptionStatus
        );
        return res.status(403).json({
          message: "Subscription required to access this resource.",
        });
      }

      console.log("User's subscription expiry date:", user.subscriptionExpiry);
      if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) {
        console.error(
          "Auth Error: User's subscription has expired. Expiry date:",
          user.subscriptionExpiry
        );
        return res.status(403).json({
          message: "Subscription expired. Please renew your plan.",
        });
      }
      console.log("Subscription validation passed for user:", user.email);
    } else {
      console.log("Subscription validation is not required for this route.");
    }

    // Attach the user object to the request for downstream use
    req.user = user;
    console.log("User attached to request:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    console.log("========== Exiting Auth Middleware ==========");
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(401).json({ message: "Invalid token or authentication failed" });
  }
};

module.exports = auth;
