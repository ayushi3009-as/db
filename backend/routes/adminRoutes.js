const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Get All Users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Don't send passwords
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get User Stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;