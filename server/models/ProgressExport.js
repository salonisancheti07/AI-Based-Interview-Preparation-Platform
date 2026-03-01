const mongoose = require('mongoose');

const progressExportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Export Details
  exportTitle: String,
  exportDescription: String,
  exportType: { 
    type: String, 
    enum: ['pdf', 'document', 'summary', 'detailed', 'portfolio'],
    default: 'pdf'
  },

  // Report Period
  reportPeriod: {
    startDate: Date,
    endDate: Date,
    duration: String // e.g., "Last 30 days", "All time"
  },

  // Overall Statistics
  overallStats: {
    totalInterviews: Number,
    totalPracticeMode: Number,
    totalTimeSpent: Number, // hours
    averageScore: Number,
    highestScore: Number,
    lowestScore: Number,
    consistencyScore: Number
  },

  // Progress Breakdown
  progressBreakdown: {
    startingLevel: String,
    currentLevel: String,
    improvementPercentage: Number,
    milestone: String
  },

  // Category-wise Performance
  categoryPerformance: [{
    category: String,
    questionsAttempted: Number,
    questionsCorrect: Number,
    accuracy: Number,
    averageScore: Number,
    timeSpent: Number,
    difficulty: String
  }],

  // Weak & Strong Areas
  weakAreas: [{
    topic: String,
    accuracy: Number,
    priority: String,
    suggestedActions: [String]
  }],

  strongAreas: [{
    topic: String,
    accuracy: Number,
    masteredAt: Date
  }],

  // Company-Specific Progress
  companyProgress: [{
    company: String,
    totalQuestions: Number,
    questionsCorrect: Number,
    readinessLevel: String,
    lastPracticedAt: Date
  }],

  // Learning Metrics
  learningMetrics: {
    conceptsCovered: Number,
    conceptsMastered: Number,
    topicsReviewed: Number,
    resourcesUsed: Number,
    chatSessionsHeld: Number,
    peakLearningDay: String
  },

  // Trend Analysis
  trends: {
    weeklyProgress: [{ week: Number, score: Number }],
    monthlyProgress: [{ month: String, score: Number }],
    performanceTrend: String, // Improving, Stable, Declining
    velocityTrend: String
  },

  // Goals Tracking
  goalsTracking: {
    goalsSet: Number,
    goalsCompleted: Number,
    completionRate: Number,
    goalsStatus: [{
      goalName: String,
      targetValue: Number,
      currentValue: Number,
      status: String, // On Track, Completed, Behind
      progressPercentage: Number
    }]
  },

  // Achievements & Badges
  achievements: {
    totalBadges: Number,
    badgesEarned: [String],
    levelAchieved: Number,
    totalPoints: Number
  },

  // Comparison Data
  comparison: {
    vsLastMonth: Number,
    vs3MonthsAgo: Number,
    vsStartOfYear: Number,
    percentileRank: Number,
    averageUserComparison: Number
  },

  // Recommendations
  recommendations: {
    nextFocusAreas: [String],
    practiceFrequency: String,
    estimatedTimeToReady: String,
    suggestedPreparationStrategy: String
  },

  // Export Files
  exportFiles: [{
    fileName: String,
    fileType: { type: String, enum: ['pdf', 'excel', 'png', 'document'] },
    fileUrl: String,
    fileSize: Number,
    createdAt: Date,
    downloadCount: Number
  }],

  // Social Sharing
  shareableLink: String,
  isPubliclyVisible: { type: Boolean, default: false },
    canShare: { type: Boolean, default: true },
    shareSettings: {
    shareWithFriends: [mongoose.Schema.Types.ObjectId],
    shareOnSocialMedia: { type: Boolean, default: false },
    shareEarnBadge: String
  },

  // Archive & History
  archiveData: {
    isArchived: { type: Boolean, default: false },
    archivedAt: Date,
    archivedVersion: Number
  },

  // Export Quality Settings
  exportSettings: {
    includeCharts: { type: Boolean, default: true },
    includeComparisons: { type: Boolean, default: true },
    includeRecommendations: { type: Boolean, default: true },
    detailLevel: { type: String, enum: ['Summary', 'Detailed', 'Comprehensive'] },
    colorTheme: String,
    brandingOptions: {
      showLogo: Boolean,
      customHeader: String,
      customFooter: String
    }
  },

  // Analytics
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  lastAccessedAt: Date,
  lastDownloadedAt: Date,

  // Metadata
  tags: [String],
  folder: String,
  favorite: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

progressExportSchema.index({ userId: 1, createdAt: -1 });
progressExportSchema.index({ userId: 1, exportType: 1 });
progressExportSchema.index({ 'reportPeriod.endDate': -1 });

module.exports = mongoose.model('ProgressExport', progressExportSchema);
