const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, enum: ['friend','family','coworker'], required: true },
  birthday: { type: Date },
  lastContact: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Person', personSchema);
