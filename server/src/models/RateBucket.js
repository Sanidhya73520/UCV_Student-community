import mongoose from 'mongoose';

const rateBucketSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    count: {
      type: Number,
      default: 1
    },
    expireAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Document expires at this exact date/time
    }
  },
  {
    versionKey: false
  }
);

export const RateBucket = mongoose.models.RateBucket || mongoose.model('RateBucket', rateBucketSchema);
