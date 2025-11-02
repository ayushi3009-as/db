const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  date: { type: Date, default: Date.now },
  message: { type: String, required: true },
  sentiment: { type: String, enum: ['positive','neutral','negative'], default: 'neutral' }
});

module.exports = mongoose.model('Interaction', interactionSchema);
