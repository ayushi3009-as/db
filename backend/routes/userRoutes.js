const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, setUserSession, clearUserSession } = require('../middleware/auth');

// Input validation helper
const validateUserInput = (name, email, password) => {
  const errors = [];

  if (!name) {
    errors.push('Name is required.');
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      errors.push('Name must be at least 2 characters long.');
    }
    if (trimmedName.length > 50) {
      errors.push('Name must not exceed 50 characters.');
    }
  }

  if (!email) {
    errors.push('Email is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    }
  }

  if (!password) {
    errors.push('Password is required.');
  } else {
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters.');
    }
  }

  return errors;
};

// Validate profile update input
const validateProfileUpdate = (name, bio) => {
  const errors = [];

  if (name) {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      errors.push('Name must be at least 2 characters long.');
    }
    if (trimmedName.length > 50) {
      errors.push('Name must not exceed 50 characters.');
    }
  }

  if (bio && bio.length > 300) {
    errors.push('Bio must not exceed 300 characters.');
  }

  return errors;
};

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const validationErrors = validateUserInput(name, email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'user'
    });

    await newUser.save();

    // Return user data without password
    const userResponse = newUser.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { user: userResponse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user.',
      error: error.message
    });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check password using bcrypt comparison
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Create session
    await setUserSession(req, user);

    // Return user data without password
    const userResponse = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: userResponse,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login.',
      error: error.message
    });
  }
});

// Logout User
router.post('/logout', authenticate, async (req, res) => {
  try {
    await clearUserSession(req);
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout.',
      error: error.message
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userResponse = req.user.getPublicProfile();
    res.json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile.',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, bio, profilePicture } = req.body;

    // Validate input
    const validationErrors = validateProfileUpdate(name, bio);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }

    // Update user fields
    if (name) req.user.name = name.trim();
    if (bio !== undefined) req.user.bio = bio.trim() || null;
    if (profilePicture !== undefined) req.user.profilePicture = profilePicture.trim() || null;

    await req.user.save();

    const userResponse = req.user.getPublicProfile();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: userResponse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile.',
      error: error.message
    });
  }
});

// Get public user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email profilePicture bio createdAt')
      .where({ isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.',
      error: error.message
    });
  }
});

// Check authentication status
router.get('/auth/status', async (req, res) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user && user.isActive) {
        const userResponse = user.getPublicProfile();
        return res.json({
          success: true,
          data: {
            authenticated: true,
            user: userResponse,
            role: user.role
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        authenticated: false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking authentication status.',
      error: error.message
    });
  }
});

module.exports = router;
