// models/images.js
const mongoose = require('mongoose');

const mlSchema = new mongoose.Schema(
  {
    anlaysesId: { type: mongoose.Schema.Types.ObjectId, ref: 'analyses', required: true },
    predictionsJson: { type: JSON },
    createdAt: { type: Date, default: Date.now },
  },
);

module.exports = mongoose.model('ml', mlSchema);