import mongoose from 'mongoose';

const wordOfTheMonthSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    word: {
      type: String,
      required: true,
      trim: true
    },
    pronunciation: {
      type: String,
      required: true,
      trim: true
    },
    meaning: {
      type: String,
      required: true,
      trim: true
    },
    exampleRo: {
      type: String,
      required: true,
      trim: true
    },
    exampleEn: {
      type: String,
      required: true,
      trim: true
    },
    challenge: {
      type: String,
      default: ''
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
    }
  },
  {
    timestamps: true
  }
);

export const WordOfTheMonth =
  mongoose.models.WordOfTheMonth ||
  mongoose.model('WordOfTheMonth', wordOfTheMonthSchema);
