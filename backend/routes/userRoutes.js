const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Prevent registration with admin email
    if (email === 'admin@echovault.com') {
      return res.status(403).json({ message: 'This email is reserved for admin' });
    }
    
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
    const { email, password, role } = req.body;
    
    console.log('Login attempt:', { email, password, role }); // ✅ Debug log
    
    // ADMIN LOGIN
    if (role === 'admin') {
      console.log('Checking admin credentials...'); // ✅ Debug log
      if (email === 'admin@echovault.com' && password === 'admin123') {
        console.log('✅ Admin login successful'); // ✅ Debug log
        return res.json({ 
          message: '✅ Admin login successful', 
          user: { 
            name: 'Admin', 
            email: 'admin@echovault.com',
            role: 'admin'
          }
        });
      } else {
        console.log('❌ Invalid admin credentials'); // ✅ Debug log
        return res.status(403).json({ message: '❌ Invalid admin credentials' });
      }
    }
    
    // USER LOGIN - Block admin email
    if (role === 'user' && email === 'admin@echovault.com') {
      return res.status(403).json({ message: '❌ Admin cannot login as user' });
    }
    
    // Regular user login
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password !== password) return res.status(400).json({ message: 'Incorrect password' });

    res.json({ 
      message: '✅ Login successful', 
      user: {
        name: user.name,
        email: user.email,
        role: 'user'
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;