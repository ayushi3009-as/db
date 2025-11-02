const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    minlength: 3
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
    minlength: 10
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ isDeleted: 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for relative time
postSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return this.createdAt.toLocaleDateString();
  }
});

// Method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes && this.likes.some(id => id.toString() === userId.toString());
};

// Method to toggle like
postSchema.methods.toggleLike = function(userId) {
  if (this.isLikedBy(userId)) {
    this.likes = this.likes.filter(id => id.toString() !== userId.toString());
    return false; // Unliked
  } else {
    this.likes.push(userId);
    return true; // Liked
  }
};

// Static method to get active posts only
postSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isDeleted: false })
    .populate('author', 'name email profilePicture')
    .sort({ createdAt: -1 });
};

// Static method for pagination
postSchema.statics.paginate = function(filter = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.findActive(filter)
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Post', postSchema);