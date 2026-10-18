import mongoose from 'mongoose';
import { QUESTION_TOPICS, QUESTION_STATUSES } from '../../../shared/enums.js';

const questionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentName: {
      type: String,
      trim: true,
      default: null,
      index: true
    },
    topic: {
      type: String,
      enum: QUESTION_TOPICS,
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: QUESTION_STATUSES,
      default: 'waiting',
      index: true
    },
    answerText: {
      type: String,
      default: null
    },
    answer: {
      type: String,
      default: null
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    answeredAt: {
      type: Date,
      default: null
    },
    answerEditedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

questionSchema.methods.toStudentJSON = function () {
  return {
    id: this._id.toString(),
    topic: this.topic,
    text: this.text,
    status: this.status,
    studentName: this.studentName,
    answerText: this.answerText,
    answeredAt: this.answeredAt,
    isEdited: !!this.answerEditedAt,
    createdAt: this.createdAt
  };
};

export const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
