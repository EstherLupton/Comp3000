import mongoose from 'mongoose';

const mlSchema = new mongoose.Schema(
  {
    anlaysesId: { type: mongoose.Schema.Types.ObjectId, ref: 'analyses', required: true },
    predictionsJson: { type: JSON },
    createdAt: { type: Date, default: Date.now },
  },
);

export default mongoose.model('ml', mlSchema);