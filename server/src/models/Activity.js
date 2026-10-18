import mongoose from 'mongoose';
import { ACTIVITY_STATUSES, ACTIVITY_COSTS } from '../../../shared/enums.js';

const activitySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ACTIVITY_STATUSES,
      default: 'planning',
      index: true
    },
    dateToConfirm: {
      type: Boolean,
      default: false
    },
    targetMonth: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      default: null,
      index: true
    },
    startTime: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    venue: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    costChoice: {
      type: String,
      enum: ACTIVITY_COSTS,
      default: 'free'
    },
    askIfGoing: {
      type: Boolean,
      default: true
    },
    quote: {
      type: String,
      default: ''
    },
    quoteSource: {
      type: String,
      default: ''
    },
    whatToBring: {
      type: [String],
      default: []
    },
    goodToKnow: {
      type: [String],
      default: []
    },
    feedbackUrl: {
      type: String,
      default: ''
    },
    itinerary: [
      {
        time: { type: String, required: true },
        title: { type: String, required: true },
        detail: { type: String, default: '' }
      }
    ],
    checklist: [
      {
        text: { type: String, required: true },
        done: { type: Boolean, default: false }
      }
    ],
    goingCount: {
      type: Number,
      default: 0
    },
    notGoingCount: {
      type: Number,
      default: 0
    },
    ratingsCount: {
      type: Number,
      default: 0
    },
    ratingsSum: {
      type: Number,
      default: 0
    },
    publishedAt: {
      type: Date,
      default: null
    },
    publishedNotifiedAt: {
      type: Date,
      default: null
    },
    reminderSentAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

activitySchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.checklist; // Never expose staff checklist
  return obj;
};

export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
