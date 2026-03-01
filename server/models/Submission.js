const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    index: true
  },
  externalQuestionId: {
    type: String,
    index: true
  },
  questionTitle: String,
  category: String,
  difficulty: String,
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'csharp'],
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'],
    default: 'Pending'
  },
  executionMode: {
    type: String,
    enum: ['run', 'submit'],
    default: 'submit'
  },
  result: {
    testsPassed: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    runtime: Number,
    memory: Number,
    error: String,
    output: String
  },
  hintLevel: {
    type: Number,
    enum: [0, 1, 2, 3],
    default: 0
  },
  hintsUsed: { type: Number, default: 0 },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  isFirstAttempt: Boolean,
  isBest: { type: Boolean, default: false }
}, { timestamps: true });

submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
