const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['solution', 'approach', 'question', 'optimization', 'general'],
    default: 'general'
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'csharp', 'none'],
    default: 'none'
  },
  code: String, // Code snippet if applicable
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: Date,
    upvotes: { type: Number, default: 0 }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isAcceptedSolution: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: Date
}, { timestamps: true });

commentSchema.index({ problemId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
