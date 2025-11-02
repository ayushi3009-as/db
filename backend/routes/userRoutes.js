const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({ name, email, password, role: 'user' });
    await newUser.save();
    res.json({ message: '✅ User registered successfully', user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password !== password) return res.status(400).json({ message: 'Incorrect password' });

    res.json({ message: '✅ Login successful', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
