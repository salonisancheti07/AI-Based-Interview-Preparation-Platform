const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  problemsStarted: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    externalQuestionId: {
      type: String,
      default: null
    },
    startedAt: Date,
    status: { type: String, enum: ['Not Started', 'In Progress', 'Solved', 'Attempted'], default: 'In Progress' }
  }],
  problemsSolved: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    externalQuestionId: {
      type: String,
      default: null
    },
    solvedAt: Date,
    hintsUsed: Number,
    submissions: Number,
    timeSpent: Number, // in minutes
    language: String
  }],
  dailyStats: [{
    date: Date,
    problemsSolved: Number,
    submissions: Number,
    timeSpent: Number
  }],
  streakData: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSolvedDate: Date,
    streakStartDate: Date
  },
  categoryProgress: {
    dsa: { attempted: Number, solved: Number },
    html: { attempted: Number, solved: Number },
    javascript: { attempted: Number, solved: Number },
    react: { attempted: Number, solved: Number },
    node: { attempted: Number, solved: Number },
    database: { attempted: Number, solved: Number },
    'system-design': { attempted: Number, solved: Number },
    behavioral: { attempted: Number, solved: Number }
  },
  difficultyProgress: {
    easy: { attempted: Number, solved: Number },
    medium: { attempted: Number, solved: Number },
    hard: { attempted: Number, solved: Number }
  },
  totalTimeSpent: { type: Number, default: 0 }, // in minutes
  achievements: [{
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);
