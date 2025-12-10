// models/images.js
const mongoose = require('mongoose');

const analysesSchema = new mongoose.Schema(
  {
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'images', required: true },
    jobStatus: { type: String},
    resultsJson: { type: JSON },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    mlClassification: { type: mongoose.Schema.Types.ObjectId, ref: 'ml', default: null },
  },
);

module.exports = mongoose.model('anlyses', analysesSchema);