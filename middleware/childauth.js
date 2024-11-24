const jwt = require('jsonwebtoken');

// Use a strong secret key stored in environment variables
const JWT_SECRET = '123'; // Replace 'your_secret_key' with a secure key

/**
 * Middleware to authenticate and authorize users.
 * @param {Array<string>} roles - List of roles allowed to access the route.
 * @returns {Function} - Express middleware function.
 */
const authx = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required.' });
    }

    try {
      // Verify the token with the same secret
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      // Check if the user's role is allowed
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
      }

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
};

module.exports = authx;

module.exports = authx;
