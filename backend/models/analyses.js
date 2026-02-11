import mongoose from 'mongoose';

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

export default mongoose.model('analyses', analysesSchema);