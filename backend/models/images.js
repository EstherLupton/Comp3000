// models/images.js
const mongoose = require('mongoose');

const imagesSchema = new mongoose.Schema(
  {
    originalFilePath: { type: String, required: true },
    steggedFilePath: { type: String },
    prepopFilePath: { type: String },
    extractedFilePath: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String },
    metadataJson: { type: JSON },
  },
);

module.exports = mongoose.model('images', imagesSchema);