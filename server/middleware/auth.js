const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'interview-prep-jwt-secret-2024';

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
      
      req.user = user; // Attach full user object
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
};

// Optional auth (for demo purposes)
const authOptional = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.user = decoded;
      
      // Get full user object if authenticated
      const user = await User.findById(req.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (err) {
    // Continue without authentication
    next();
  }
};

module.exports = auth; // Default export for backward compatibility
module.exports.auth = auth;
module.exports.authorize = authorize;
module.exports.authOptional = authOptional;
