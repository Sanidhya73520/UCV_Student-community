import mongoose from 'mongoose';

const clubAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    order: {
      type: Number,
      default: 0,
      index: true
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    },
    upvoteCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const ClubArea = mongoose.models.ClubArea || mongoose.model('ClubArea', clubAreaSchema);
