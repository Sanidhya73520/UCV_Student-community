import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index
    }
  },
  {
    timestamps: true
  }
);

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
