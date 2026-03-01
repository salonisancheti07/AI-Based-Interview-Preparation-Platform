const mongoose = require('mongoose');

const questionRecommenderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Recommendation Engine Settings
  recommendationStyle: { 
    type: String, 
    enum: ['adaptive', 'targeted', 'random', 'weak-area-focus'],
    default: 'adaptive'
  },

  // Performance-Based Recommendations
  recommendedQuestions: [{
    questionId: String,
    question: String,
    category: String,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    topic: String,
    recommendationReason: String, // Why this question
    reasonType: { type: String, enum: ['Weak Area', 'Progressive', 'Review', 'Strength Build'] },
    priority: { type: Number, min: 1, max: 100 },
    estimatedTime: Number, // in seconds
    relevanceScore: { type: Number, default: 0 }, // 0-100
    successProbability: { type: Number, default: 0 }, // 0-100
    attempted: { type: Boolean, default: false },
    attemptedAt: Date,
    performanceOnAttempt: Number,
    addedAt: { type: Date, default: Date.now }
  }],

  // Learning Path Integration
  nextMilestoneQuestions: [{
    milestone: String,
    questions: [String],
    priority: Number,
    targetCompletionDate: Date
  }],

  // Weak Area Focus
  weakAreaAnalysis: [{
    topic: String,
    weaknessScore: Number,
    suggestedQuestions: [String],
    recommendedActions: [String],
    estimatedTimeToMastery: Number // in hours
  }],

  // Strength Building
  strengthBuildingPath: [{
    strength: String,
    currentLevel: { type: String, enum: ['Intermediate', 'Advanced', 'Expert'] },
    nextLevelQuestions: [String],
    challengeQuestions: [String]
  }],

  // Company-Specific Recommendations
  companyFocusedQuestions: [{
    company: String,
    questions: [String],
    frequency: Number,
    difficulty: String,
    importance: { type: Number, min: 1, max: 5 }
  }],

  // Role-Based Recommendations
  roleSpecificPath: [{
    role: String,
    recommendedTopics: [String],
    questionSequence: [String],
    estimatedPreparationTime: Number
  }],

  // Difficulty Progression
  difficultyProgression: [{
    currentDifficulty: String,
    nextDifficulty: String,
    transitionQuestions: [String],
    readinessScore: Number
  }],

  // Interview Type Focus
  interviewTypeFocus: [{
    type: { type: String, enum: ['technical', 'behavioral', 'hr', 'system-design'] },
    focusQuestions: [String],
    priority: Number,
    timeAllocation: Number // percentage
  }],

  // Spaced Repetition
  spacedRepetitionSchedule: [{
    questionId: String,
    nextReviewDate: Date,
    reviewCount: Number,
    difficulty: String,
    lastReviewDate: Date,
    confidenceLevel: { type: Number, min: 1, max: 5 }
  }],

  // AI Learning Insights
  learningInsights: {
    learningVelocity: String, // Fast, Normal, Slow
    retentionRate: Number,
    learningStyle: String, // Visual, Auditory, Kinesthetic
    recommendedPaceHoursPerDay: Number,
    predictedReadinessDate: Date
  },

  // Custom Preferences
  preferences: {
    preferredDifficulty: String,
    preferredTopics: [String],
    avoidTopics: [String],
    timePerQuestion: Number,
    dailyQuestionTarget: Number,
    interviewDateTarget: Date
  },

  // Question Bank Stats
  questionStats: {
    totalRecommended: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    avgTimePerQuestion: { type: Number, default: 0 }
  },

  // Feedback Loop
  userFeedback: [{
    questionId: String,
    feedback: { type: String, enum: ['Too Easy', 'Just Right', 'Too Hard', 'Irrelevant'] },
    suggestedDifficulty: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Recommendations History
  recommendationHistory: [{
    date: Date,
    recommendationsCount: Number,
    questionsAttempted: Number,
    accuracy: Number
  }],

  // Next Actions
  immediateNextSteps: [String],
  weeklyGoals: [String],
  monthlyObjectives: [String],

  lastUpdated: { type: Date, default: Date.now },
  nextUpdateScheduled: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

questionRecommenderSchema.index({ userId: 1 });
questionRecommenderSchema.index({ 'recommendedQuestions.priority': -1 });
questionRecommenderSchema.index({ 'weakAreaAnalysis.topic': 1 });

module.exports = mongoose.model('QuestionRecommender', questionRecommenderSchema);
