import mongoose from 'mongoose';

const clubUpvoteSchema = new mongoose.Schema(
  {
    clubAreaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClubArea',
      required: true,
      index: true
    },
    voterKey: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// One upvote per area per voterKey
clubUpvoteSchema.index({ clubAreaId: 1, voterKey: 1 }, { unique: true });

export const ClubUpvote =
  mongoose.models.ClubUpvote || mongoose.model('ClubUpvote', clubUpvoteSchema);
