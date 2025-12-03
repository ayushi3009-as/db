const express = require('express');
const router = express.Router();
const Memory = require('../models/Memory');

// ✅ Create Memory (POST)
router.post('/', async (req, res) => {
  try {
    console.log('Received memory:', req.body); // Debug log
    
    const { userEmail, userName, title, content } = req.body;
    
    if (!userEmail || !userName || !title || !content) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const newMemory = new Memory({
      userEmail,
      userName,
      title,
      content
    });
    
    await newMemory.save();
    console.log('Memory saved:', newMemory); // Debug log
    
    res.json({ message: '✅ Memory created successfully', memory: newMemory });
  } catch (err) {
    console.error('Error creating memory:', err); // Debug log
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Memories by User Email (GET)
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    console.log('Getting memories for:', email); // Debug log
    
    const memories = await Memory.find({ userEmail: email }).sort({ createdAt: -1 });
    console.log('Found memories:', memories.length); // Debug log
    
    res.json({ memories });
  } catch (err) {
    console.error('Error fetching memories:', err); // Debug log
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get All Memories (GET)
router.get('/all', async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    res.json({ memories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete Memory (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Memory deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;