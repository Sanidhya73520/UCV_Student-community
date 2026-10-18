import mongoose from 'mongoose';
import { CONTENT_STATES } from '../../../shared/enums.js';

const sharedWordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    word: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    meaning: {
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

sharedWordSchema.index({ state: 1, createdAt: -1 });

export const SharedWord = mongoose.models.SharedWord || mongoose.model('SharedWord', sharedWordSchema);
