import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../../../shared/enums.js';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      required: true
    },
    targetId: {
      type: String,
      default: null
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 365 * 24 * 60 * 60 } // 1 year TTL
    }
  },
  {
    versionKey: false
  }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
