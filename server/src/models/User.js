import mongoose from 'mongoose';
import { USER_ROLES, STUDENT_STATUSES, STAFF_STATUSES, JOIN_SOURCES, STUDENT_PROGRAMMES } from '../../../shared/enums.js';
import { getCountryName } from '../../../shared/countries.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },
    passwordHash: {
      type: String,
      default: null
    },
    mobile: {
      type: String,
      trim: true,
      default: ''
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    faculty: {
      type: String,
      trim: true,
      default: ''
    },
    programme: {
      type: String,
      enum: STUDENT_PROGRAMMES,
      default: 'other'
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'student'
    },
    status: {
      type: String,
      required: true,
      default: function () {
        return this && this.role !== 'student' ? 'invited' : 'waiting';
      }
    },
    joinSource: {
      type: String,
      enum: JOIN_SOURCES,
      default: 'signup'
    },
    isPermanentAdmin: {
      type: Boolean,
      default: false
    },
    isAmbassador: {
      type: Boolean,
      default: false
    },
    ambassadorHoursLogged: {
      type: Number,
      default: 0
    },
    ambassadorHistory: [
      {
        date: { type: Date, default: Date.now },
        hours: { type: Number, default: 0 },
        whatDidTheyDo: { type: String, default: '' },
        loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        loggedAt: { type: Date, default: Date.now }
      }
    ],
    temporaryPasswordHash: {
      type: String,
      default: null
    },
    tempPasswordExpiresAt: {
      type: Date,
      default: null
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    approvedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    consentDate: {
      type: Date,
      default: null
    },
    consentTextVersion: {
      type: String,
      default: 'v1.0'
    },
    notificationPrefs: {
      newActivities: { type: Boolean, default: true },
      questionAnswers: { type: Boolean, default: true },
      communityUpdates: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.temporaryPasswordHash;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.temporaryPasswordHash;
        return ret;
      }
    }
  }
);

// Indexes
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, status: 1, createdAt: -1 });
userSchema.index({ countryCode: 1 });

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    countryCode: this.countryCode,
    countryName: getCountryName(this.countryCode)
  };
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
