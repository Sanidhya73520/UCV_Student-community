import mongoose from 'mongoose';

const importJobSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    rows: [
      {
        rowNumber: Number,
        fullName: String,
        firstName: String,
        email: String,
        mobile: String,
        countryCode: String,
        faculty: String,
        status: {
          type: String,
          enum: ['new', 'update', 'missing_email', 'fix']
        },
        issue: String
      }
    ],
    counts: {
      newCount: { type: Number, default: 0 },
      updateCount: { type: Number, default: 0 },
      missingEmailCount: { type: Number, default: 0 },
      fixCount: { type: Number, default: 0 }
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 3600 } // 1 hour TTL
    }
  },
  {
    versionKey: false
  }
);

export const ImportJob =
  mongoose.models.ImportJob || mongoose.model('ImportJob', importJobSchema);
