const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Rate limiting for post creation (10 posts per hour per user)
const postCreationCache = new Map();

const rateLimitPostCreation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for posting.'
    });
  }

  const userId = req.user._id.toString();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (!postCreationCache.has(userId)) {
    postCreationCache.set(userId, { count: 1, resetTime: now + oneHour });
    return next();
  }

  const userPosts = postCreationCache.get(userId);

  if (now > userPosts.resetTime) {
    postCreationCache.set(userId, { count: 1, resetTime: now + oneHour });
    return next();
  }

  if (userPosts.count >= 10) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Maximum 10 posts per hour.'
    });
  }

  userPosts.count++;
  next();
};

// Input validation helper
const validatePostInput = (title, content) => {
  const errors = [];

  if (!title) {
    errors.push('Title is required.');
  } else {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      errors.push('Title must be at least 3 characters long.');
    }
    if (trimmedTitle.length > 200) {
      errors.push('Title must not exceed 200 characters.');
    }
  }

  if (!content) {
    errors.push('Content is required.');
  } else {
    const trimmedContent = content.trim();
    if (trimmedContent.length < 10) {
      errors.push('Content must be at least 10 characters long.');
    }
    if (trimmedContent.length > 5000) {
      errors.push('Content must not exceed 5000 characters.');
    }
  }

  return errors;
};

// Sanitize HTML to prevent XSS
const sanitizeHtml = (html) => {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// POST /api/posts - Create new post
router.post('/', authenticate, rateLimitPostCreation, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate input
    const validationErrors = validatePostInput(title, content);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }

    // Sanitize input
    const sanitizedTitle = sanitizeHtml(title.trim());
    const sanitizedContent = sanitizeHtml(content.trim());

    const newPost = new Post({
      title: sanitizedTitle,
      content: sanitizedContent,
      author: req.user._id
    });

    await newPost.save();
    await newPost.populate('author', 'name email profilePicture');

    res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      data: newPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating post.',
      error: error.message
    });
  }
});

// GET /api/posts - Get all posts (public, paginated, time-sorted)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters.'
      });
    }

    const posts = await Post.paginate({}, page, limit);
    const total = await Post.countDocuments({ isDeleted: false });

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

// GET /api/posts/user/:userId - Get user's posts
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters.'
      });
    }

    const posts = await Post.paginate({ author: userId }, page, limit);
    const total = await Post.countDocuments({ author: userId, isDeleted: false });

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
      message: 'Error fetching user posts.',
      error: error.message
    });
  }
});

// GET /api/posts/:id - Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false })
      .populate('author', 'name email profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching post.',
      error: error.message
    });
  }
});

// PUT /api/posts/:id - Update post (author only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validate input
    const validationErrors = validatePostInput(title, content);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }

    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can update this post.'
      });
    }

    // Sanitize input
    const sanitizedTitle = sanitizeHtml(title.trim());
    const sanitizedContent = sanitizeHtml(content.trim());

    post.title = sanitizedTitle;
    post.content = sanitizedContent;
    await post.save();
    await post.populate('author', 'name email profilePicture');

    res.json({
      success: true,
      message: 'Post updated successfully.',
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating post.',
      error: error.message
    });
  }
});

// DELETE /api/posts/:id - Delete post (author or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    // Check if user is the author or admin
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the author or admin can delete this post.'
      });
    }

    post.isDeleted = true;
    await post.save();

    res.json({
      success: true,
      message: 'Post deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting post.',
      error: error.message
    });
  }
});

// POST /api/posts/:id/like - Toggle like on post
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    const wasLiked = post.toggleLike(req.user._id);
    await post.save();

    res.json({
      success: true,
      message: wasLiked ? 'Post liked successfully.' : 'Post unliked successfully.',
      data: {
        liked: wasLiked,
        likeCount: post.likeCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling like.',
      error: error.message
    });
  }
});

module.exports = router;