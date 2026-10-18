import mongoose from 'mongoose';
import { CONTENT_STATES } from '../../../shared/enums.js';

const wallPostSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlyQuestion',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      enum: CONTENT_STATES,
      default: 'visible',
      index: true
    },
    meTooCount: {
      type: Number,
      default: 0
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    removedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

wallPostSchema.index({ questionId: 1, state: 1, createdAt: -1 });

export const WallPost = mongoose.models.WallPost || mongoose.model('WallPost', wallPostSchema);
