import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../../../shared/enums.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    detail: {
      type: String,
      default: ''
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 120 * 24 * 60 * 60 } // 4 months TTL (120 days)
    }
  },
  {
    versionKey: false
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
