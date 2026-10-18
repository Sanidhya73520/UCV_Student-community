import mongoose from 'mongoose';

const meTooSchema = new mongoose.Schema(
  {
    wallPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WallPost',
      required: true,
      index: true
    },
    voterKey: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// One me-too per post per voterKey
meTooSchema.index({ wallPostId: 1, voterKey: 1 }, { unique: true });

export const MeToo = mongoose.models.MeToo || mongoose.model('MeToo', meTooSchema);
