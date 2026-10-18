import mongoose from 'mongoose';

const clubMembershipSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// One membership per user per club
clubMembershipSchema.index({ clubId: 1, userId: 1 }, { unique: true });

export const ClubMembership =
  mongoose.models.ClubMembership || mongoose.model('ClubMembership', clubMembershipSchema);
