const mongoose = require('mongoose');

const quickPracticeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Session Details
  sessionTitle: String,
  sessionDescription: String,
  modeSelected: { 
    type: String, 
    enum: ['5-min', '10-min', '15-min', '30-min'],
    required: true
  },

  duration: { type: Number, required: true }, // in minutes
  timeRemaining: Number,

  // Question Selection
  category: String, // DSA, System Design, Behavioral, etc.
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'] },
  topicFocus: String, // Optional: specific topic
  numberQuestions: Number,

  // Session Progress
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Paused', 'Completed', 'Abandoned'],
    default: 'Not Started'
  },

  startTime: Date,
  pauseTime: Date,
  resumeTime: Date,
  endTime: Date,
  actualDuration: Number, // in seconds

  // Questions in Session
  questions: [{
    questionIndex: Number,
    question: String,
    category: String,
    difficulty: String,
    timeLimit: Number, // seconds
    timeSpent: Number,
    userAnswer: String,
    isCorrect: { type: Boolean, default: null },
    score: { type: Number, default: 0 },
    feedback: String,
    skipped: { type: Boolean, default: false },
    hintUsed: { type: Boolean, default: false },
    hintLevel: Number
  }],

  // Performance Metrics
  performanceMetrics: {
    questionsAttempted: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 },
    questionsSkipped: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }, // percentage
    averageTimePerQuestion: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    percentageScore: { type: Number, default: 0 }
  },

  // Speed Challenge
  speedMetrics: {
    avgTimePerQuestion: Number,
    fastestAnswerTime: Number,
    slowestAnswerTime: Number,
    speedRating: String // Lightning Fast, Fast, Normal, Slow
  },

  // Difficulty Analysis
  difficultyBreakdown: {
    easyAttempted: Number,
    easyCorrect: Number,
    mediumAttempted: Number,
    mediumCorrect: Number,
    hardAttempted: Number,
    hardCorrect: Number
  },

  // Streak & Momentum
  currentStreak: Number,
    maxStreak: Number,
  momentum: { type: Number, min: 0, max: 100 }, // 0-100 energy level

  // Comparison Data
  previousSessionScore: Number,
  scoreImprovement: Number,
  improvementPercentage: Number,
  consistencyRating: String,

  // Hints & Help Used
  hintsUsed: [{
    questionIndex: Number,
    hintLevel: { type: Number, enum: [1, 2, 3] },
    hintUsedAt: Date
  }],
  skipCount: { type: Number, default: 0 },
  totalHintsUsed: { type: Number, default: 0 },

  // Real-Time Feedback
  realTimeFeedback: [{
    questionIndex: Number,
    immediateReaction: String, // Correct, Incorrect, Partial
    aiComment: String,
    encouragement: String
  }],

  // Post-Session Insights
  keyLearnings: [String],
  areasToFocus: [String],
  nextRecommendedMode: String,

  // Replay & Review
  canReplaySession: { type: Boolean, default: true },
  replaysCount: { type: Number, default: 0 },
  lastReplayedAt: Date,

  // Leaderboard
  leaderboardRank: Number,
  percentileRank: Number,
  competitorComparison: String,

  // Tags & Categories
  tags: [String],
  sessionType: { type: String, enum: ['practice', 'challenge', 'daily-challenge'] },

  // Notifications
  showCongratulations: { type: Boolean, default: true },
  earnedBadges: [String],
  earnedPoints: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

quickPracticeSchema.index({ userId: 1, createdAt: -1 });
quickPracticeSchema.index({ userId: 1, modeSelected: 1 });
quickPracticeSchema.index({ 'performanceMetrics.accuracy': -1 });

module.exports = mongoose.model('QuickPractice', quickPracticeSchema);
