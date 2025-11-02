const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticate, adminOnly, setUserSession, clearUserSession } = require('../middleware/auth');

// Admin Login
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

    // Find admin user
    const admin = await User.findOne({
      email: email.toLowerCase().trim(),
      role: 'admin',
      isActive: true
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.'
      });
    }

    // Check password using bcrypt comparison
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.'
      });
    }

    // Update last login
    await admin.updateLastLogin();

    // Create session
    await setUserSession(req, admin);

    // Return admin data without password
    const adminResponse = admin.getPublicProfile();

    res.json({
      success: true,
      message: 'Admin login successful.',
      data: {
        admin: adminResponse
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during admin login.',
      error: error.message
    });
  }
});

// Admin Logout
router.post('/logout', authenticate, adminOnly, async (req, res) => {
  try {
    await clearUserSession(req);
    res.json({
      success: true,
      message: 'Admin logged out successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout.',
      error: error.message
    });
  }
});

// Get all users with pagination and search
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters.'
      });
    }

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('name email role isActive profilePicture createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users.',
      error: error.message
    });
  }
});

// Get user details with post count
router.get('/users/:userId', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('name email role isActive profilePicture bio createdAt lastLogin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const postCount = await Post.countDocuments({
      author: userId,
      isDeleted: false
    });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalPosts: postCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user details.',
      error: error.message
    });
  }
});

// Toggle user active status
router.post('/users/:userId/toggle', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own admin account.'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: {
        userId: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling user status.',
      error: error.message
    });
  }
});

// Soft delete user
router.delete('/users/:userId', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account.'
      });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    // Also soft delete all user's posts
    await Post.updateMany(
      { author: userId },
      { isDeleted: true }
    );

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user.',
      error: error.message
    });
  }
});

// Get all posts (including deleted)
router.get('/posts', authenticate, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters.'
      });
    }

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') {
      filter.isDeleted = false;
    } else if (status === 'deleted') {
      filter.isDeleted = true;
    }

    const skip = (page - 1) * limit;

    const posts = await Post.find(filter)
      .populate('author', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching posts.',
      error: error.message
    });
  }
});

// Delete any post (hard delete for admin)
router.delete('/posts/:postId', authenticate, adminOnly, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Post deleted permanently.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting post.',
      error: error.message
    });
  }
});

// Restore deleted post
router.post('/posts/:postId/restore', authenticate, adminOnly, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    post.isDeleted = false;
    await post.save();
    await post.populate('author', 'name email profilePicture');

    res.json({
      success: true,
      message: 'Post restored successfully.',
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error restoring post.',
      error: error.message
    });
  }
});

// Get system analytics
router.get('/analytics', authenticate, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalPosts,
      activeToday,
      postsToday,
      postsThisWeek,
      postsThisMonth,
      mostActiveUsers,
      mostPopularPosts
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Post.countDocuments({ isDeleted: false }),
      User.countDocuments({ lastLogin: { $gte: today } }),
      Post.countDocuments({ createdAt: { $gte: today }, isDeleted: false }),
      Post.countDocuments({ createdAt: { $gte: thisWeek }, isDeleted: false }),
      Post.countDocuments({ createdAt: { $gte: thisMonth }, isDeleted: false }),
      User.aggregate([
        { $match: { role: 'user' } },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'author',
            as: 'userPosts'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            postCount: { $size: { $filter: { input: '$userPosts', cond: { $eq: ['$$this.isDeleted', false] } } } }
          }
        },
        { $sort: { postCount: -1 } },
        { $limit: 5 }
      ]),
      Post.find({ isDeleted: false })
        .populate('author', 'name')
        .sort({ likes: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          activeToday
        },
        posts: {
          total: totalPosts,
          today: postsToday,
          thisWeek: postsThisWeek,
          thisMonth: postsThisMonth
        },
        mostActiveUsers,
        mostPopularPosts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics.',
      error: error.message
    });
  }
});

// Create new admin user
router.post('/users/create-admin', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
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

    // Create new admin
    const newAdmin = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'admin'
    });

    await newAdmin.save();

    const adminResponse = newAdmin.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully.',
      data: { admin: adminResponse }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating admin user.',
      error: error.message
    });
  }
});

module.exports = router;
