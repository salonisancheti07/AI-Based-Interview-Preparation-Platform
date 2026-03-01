const mongoose = require('mongoose');

const performanceMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Daily metrics
  dailyStats: [{
    date: Date,
    problemsSolved: Number,
    mockInterviewsTaken: Number,
    chatSessionsHeld: Number,
    totalTimeSpent: Number, // in minutes
    averageScore: Number,
    topicsReviewed: [String]
  }],
  
  // Weekly metrics
  weeklyStats: [{
    weekStartDate: Date,
    totalProblems: Number,
    totalMockInterviews: Number,
    averageScore: Number,
    improvementPercentage: Number,
    consistency: Number, // 0-100 based on daily activity
    topicsCovered: [String]
  }],
  
  // Monthly metrics
  monthlyStats: [{
    month: String, // "January 2026"
    totalProblems: Number,
    totalMockInterviews: Number,
    averageScore: Number,
    bestScore: Number,
    improvementTrend: String, // Improving, Stable, Declining
    certifications: [String],
    topicsCompleted: [String]
  }],
  
  // Overall growth metrics
  growthMetrics: {
    totalProblemsAttempted: Number,
    totalProblemsSolved: Number,
    totalMockInterviews: Number,
    totalChatSessions: Number,
    totalTimeInvested: Number, // in hours
    averageGrowthRate: Number, // % improvement per month
    longestStreak: Number, // consecutive days
    currentStreak: Number
  },
  
  // AI-generated insights
  trendAnalysis: {
    improvementTrend: String, // "Rapid Improvement", "Steady Progress", "Plateauing"
    nextMilestoneETA: String, // "3 weeks to Intermediate level"
    consistencyScore: Number,
    dedicationLevel: String, // "Very High", "High", "Moderate", "Low"
    estimatedReadiness: {
      forInterview: { percentage: Number, estimatedAt: Date },
      for: [{ role: String, percentage: Number }]
    }
  },
  
  // Anomalies and insights
  anomalies: [{
    type: String, // "Score drop", "Increased difficulty", "Reduced activity"
    description: String,
    date: Date,
    severity: { type: String, enum: ['Low', 'Medium', 'High'] },
    recommendation: String
  }],
  
  // Plagiarism/Cheat detection (optional advanced feature)
  plagiarismMetrics: [{
    submissionId: mongoose.Schema.Types.ObjectId,
    similarityScore: Number, // 0-100
    matchedWith: [String], // URLs or submission IDs
    flaggedAt: Date,
    severity: { type: String, enum: ['None', 'Minor', 'Moderate', 'Severe'] }
  }],
  
  // Prediction models
  predictions: {
    probableNextScoreTrend: String, // Will improve, stay same, decline
    recommendedFocusTopic: String,
    estimatedTimeToTargetRole: String,
    interviewSuccessProbability: { type: Number, 0: 100 },
    careerPathRecommendation: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

performanceMetricsSchema.index({ userId: 1, 'dailyStats.date': -1 });

module.exports = mongoose.model('PerformanceMetrics', performanceMetricsSchema);
