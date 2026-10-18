import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
);

// One feedback per user per activity
feedbackSchema.index({ activityId: 1, userId: 1 }, { unique: true });

export const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
