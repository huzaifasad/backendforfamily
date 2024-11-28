const jwt = require("jsonwebtoken");

// Secret key for JWT (same as used in the login route)
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Middleware to protect routes
const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach the decoded token (user info) to the request object for further use
    req.user = decoded;

    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to access this resource." });
    }

    next(); // Proceed to the next middleware/route
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = authenticateAdmin;
