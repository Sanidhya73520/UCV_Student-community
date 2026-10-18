import mongoose from 'mongoose';
import { CLUB_STATUSES } from '../../../shared/enums.js';

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    motto: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    frequency: {
      type: String,
      default: '',
      trim: true
    },
    whatsappUrl: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: CLUB_STATUSES,
      default: 'draft',
      index: true
    },
    memberCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

clubSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.whatsappUrl; // WhatsApp link never visible publicly or to non-members
  return obj;
};

export const Club = mongoose.models.Club || mongoose.model('Club', clubSchema);
