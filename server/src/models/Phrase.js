import mongoose from 'mongoose';

const phraseSchema = new mongoose.Schema(
  {
    romanian: {
      type: String,
      required: true,
      trim: true
    },
    pronunciation: {
      type: String,
      required: true,
      trim: true
    },
    english: {
      type: String,
      required: true,
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
    }
  },
  {
    timestamps: true
  }
);

export const Phrase = mongoose.models.Phrase || mongoose.model('Phrase', phraseSchema);
