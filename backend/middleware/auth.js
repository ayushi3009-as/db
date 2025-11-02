const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('../models/User');

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/echo_vault',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
};

// Initialize session middleware
const sessionMiddleware = session(sessionConfig);

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user account deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  next();
};

// Optional authentication (doesn't block if not logged in)
const optionalAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next(); // Continue without authentication
  }
};

// Helper to set user session
const setUserSession = (req, user) => {
  return new Promise((resolve, reject) => {
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Helper to clear user session
const clearUserSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = {
  sessionMiddleware,
  authenticate,
  adminOnly,
  optionalAuth,
  setUserSession,
  clearUserSession
};