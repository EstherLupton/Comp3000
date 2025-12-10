// models/images.js
const mongoose = require('mongoose');

const reportsSchema = new mongoose.Schema(
  {
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'images', required: true },
    reportFilePath: { type: String, required: true },
    reportType: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
);

module.exports = mongoose.model('reports', reportsSchema);