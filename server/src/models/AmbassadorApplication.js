import mongoose from 'mongoose';
import { AMBASSADOR_STATUSES } from '../../../shared/enums.js';

const ambassadorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    why: {
      type: String,
      required: true,
      trim: true
    },
    languages: {
      type: String,
      required: true,
      trim: true
    },
    hoursPerMonth: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: AMBASSADOR_STATUSES,
      default: 'applied',
      index: true
    },
    role: {
      type: String,
      default: ''
    },
    inCraiovaUntil: {
      type: String,
      default: ''
    },
    totalHours: {
      type: Number,
      default: 0
    },
    hoursHistory: [
      {
        date: { type: Date, required: true },
        hours: { type: Number, required: true },
        whatDidTheyDo: { type: String, default: '' },
        loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        loggedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const AmbassadorApplication =
  mongoose.models.AmbassadorApplication ||
  mongoose.model('AmbassadorApplication', ambassadorApplicationSchema);
