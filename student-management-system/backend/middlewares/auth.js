const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/tokenBlacklist');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const blacklisted = await TokenBlacklist.isBlacklisted(token);
    if (blacklisted) return res.status(401).json({ message: 'Token revoked. Please login again.' });

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
