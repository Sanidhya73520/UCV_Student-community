import mongoose from 'mongoose';
import { GOING_RESPONSES } from '../../../shared/enums.js';

const rsvpSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    response: {
      type: String,
      enum: GOING_RESPONSES,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: exactly one RSVP per user per activity
rsvpSchema.index({ activityId: 1, userId: 1 }, { unique: true });
rsvpSchema.index({ activityId: 1, response: 1 });

export const Rsvp = mongoose.models.Rsvp || mongoose.model('Rsvp', rsvpSchema);
