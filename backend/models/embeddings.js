import mongoose from 'mongoose';

const embeddingsSchema = new mongoose.Schema(
  {
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'images', required: true },
    jobStatus: { type: String},
    steggedFilePath: { type: String },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    embeddingParams: { type: JSON },
  },
);

export default mongoose.model('embeddings', embeddingsSchema);