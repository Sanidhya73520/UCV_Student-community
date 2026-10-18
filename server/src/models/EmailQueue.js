import mongoose from 'mongoose';
import { EMAIL_TYPES } from '../../../shared/enums.js';

const emailQueueSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    type: {
      type: String,
      enum: EMAIL_TYPES,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    html: {
      type: String,
      default: null // Wiped after successful sending for privacy
    },
    text: {
      type: String,
      default: null // Wiped after successful sending
    },
    priority: {
      type: Number,
      default: 1, // 1 = highest/transactional, 5 = lowest/announcements
      index: true
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'sent', 'failed'],
      default: 'queued',
      index: true
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true,
      sparse: true
    },
    lockedAt: {
      type: Date,
      default: null
    },
    nextAttemptAt: {
      type: Date,
      default: null,
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: {
      type: Date,
      default: null
    },
    sentAt: {
      type: Date,
      default: null
    },
    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

emailQueueSchema.index({ status: 1, nextAttemptAt: 1, priority: 1, createdAt: 1 });
emailQueueSchema.index({ recipient: 1, type: 1, status: 1 });

export const EmailQueue =
  mongoose.models.EmailQueue || mongoose.model('EmailQueue', emailQueueSchema);
