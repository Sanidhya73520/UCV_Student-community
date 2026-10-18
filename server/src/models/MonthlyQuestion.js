import mongoose from 'mongoose';

const monthlyQuestionSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true
    },
    wallUpvoteColor: {
      type: String,
      default: '#1E7B4C',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const MonthlyQuestion =
  mongoose.models.MonthlyQuestion ||
  mongoose.model('MonthlyQuestion', monthlyQuestionSchema);
