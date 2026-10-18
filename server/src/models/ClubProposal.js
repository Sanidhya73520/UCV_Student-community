import mongoose from 'mongoose';
import { PROPOSAL_STATUSES } from '../../../shared/enums.js';

const clubProposalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    idea: {
      type: String,
      default: '',
      trim: true
    },
    wantsToHelp: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: PROPOSAL_STATUSES,
      default: 'received',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const ClubProposal =
  mongoose.models.ClubProposal || mongoose.model('ClubProposal', clubProposalSchema);
