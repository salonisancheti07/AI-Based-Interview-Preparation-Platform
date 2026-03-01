const mongoose = require('mongoose');

const userPerformanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Overall metrics
  overallReadinessScore: { type: Number, 0: 100, default: 0 },
  overallConfidenceScore: { type: Number, 0: 100, default: 0 },
  interviewSuccessRate: { type: Number, 0: 100, default: 0 },
  
  // By category performance
  categoryPerformance: {
    technical: {
      averageScore: { type: Number, 0: 100, default: 0 },
      questionsAttempted: { type: Number, default: 0 },
      strongTopics: [String],
      weakTopics: [String],
      improvementRate: { type: Number, 0: 100, default: 0 }
    },
    behavioral: {
      averageScore: { type: Number, 0: 100, default: 0 },
      questionsAttempted: { type: Number, default: 0 },
      communicationScore: { type: Number, 0: 100, default: 0 },
      confidenceScore: { type: Number, 0: 100, default: 0 },
      improvementRate: { type: Number, 0: 100, default: 0 }
    },
    coding: {
      averageScore: { type: Number, 0: 100, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      optimizationScore: { type: Number, 0: 100, default: 0 },
      improvementRate: { type: Number, 0: 100, default: 0 }
    },
    hr: {
      averageScore: { type: Number, 0: 100, default: 0 },
      questionsAttempted: { type: Number, default: 0 },
      grammarScore: { type: Number, 0: 100, default: 0 },
      structureScore: { type: Number, 0: 100, default: 0 }
    }
  },
  
  // Weak topics needing improvement
  weakTopics: [{
    topic: String,
    averageScore: Number,
    questionsAttempted: Number,
    lastAttempt: Date,
    priority: { type: String, enum: ['High', 'Medium', 'Low'] }
  }],
  
  // Strong topics
  strongTopics: [{
    topic: String,
    averageScore: Number,
    questionsAttempted: Number,
    masteredAt: Date
  }],
  
  // Interview attempts history
  interviewAttempts: [{
    interviewId: mongoose.Schema.Types.ObjectId,
    date: Date,
    type: String, // technical, behavioral, hr
    roleTarget: String,
    score: Number,
    readiness: Number,
    feedback: String
  }],
  
  // Performance trends
  trends: {
    lastWeekScore: Number,
    lastMonthScore: Number,
    improvementPercentage: Number,
    streakDays: { type: Number, default: 0 },
    lastActivityDate: Date
  },
  
  // Role-specific performance
  rolePerformance: [{
    role: String,
    company: String,
    averageScore: Number,
    practiceCount: Number,
    readiness: { type: String, enum: ['Poor', 'Fair', 'Good', 'Excellent'] },
    lastPractice: Date
  }],
  
  // AI insights
  aiInsights: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    estimatedReadiness: { type: String, enum: ['Not Ready', 'Somewhat Ready', 'Ready', 'Very Ready'] },
    nextMilestone: String,
    timeToReady: String // "2 weeks of daily practice"
  },
  
  // Goals and targets
  goals: [{
    goalType: { type: String, enum: ['score', 'topic', 'consistency'] },
    description: String,
    targetValue: Number,
    currentValue: Number,
    deadline: Date,
    progress: { type: Number, 0: 100, default: 0 },
    status: { type: String, enum: ['Active', 'Completed', 'Abandoned'] }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('UserPerformance', userPerformanceSchema);
