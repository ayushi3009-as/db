const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (admin.role !== 'admin') return res.status(403).json({ message: 'Not an admin account' });
    if (admin.password !== password) return res.status(400).json({ message: 'Incorrect password' });

    res.json({ message: '✅ Admin login successful', admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Load all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
