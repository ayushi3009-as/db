const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");

// ✅ Get all posts (for user feed)
router.get("/all", async (req, res) => {
  try {
    const posts = await Post.find().populate("userId", "name email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Create new post
router.post("/add", async (req, res) => {
  try {
    const { title, content, userId } = req.body;
    const post = new Post({ title, content, userId });
    await post.save();
    res.status(201).json({ message: "Post added successfully!", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get posts by user
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin delete post
router.delete("/:postId", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
