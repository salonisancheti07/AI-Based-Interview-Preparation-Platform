const mongoose = require('mongoose');

const interviewReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockInterview'
  },

  // Report Details
  reportTitle: String,
  interviewType: { type: String, enum: ['technical', 'behavioral', 'hr', 'mixed'] },
  targetRole: String,
  targetCompany: String,
  reportDate: { type: Date, default: Date.now },

  // Overall Scores
  overallScore: { type: Number, default: 0 },
  readinessScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  technicalScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },

  // Question-wise Analysis
  questionAnalysis: [{
    questionIndex: Number,
    question: String,
    userAnswer: String,
    scores: {
      correctness: Number,
      relevance: Number,
      clarity: Number,
      communication: Number,
      confidence: Number
    },
    feedback: String,
    improvements: [String],
    timeSpent: Number
  }],

  // Performance Summary
  performanceSummary: {
    strengths: [String],
    weakAreas: [String],
    overallFeedback: String,
    keyTakeaways: [String],
    recommendations: [String]
  },

  // Comparison Data
  comparison: {
    previousScore: Number,
    improvement: Number,
    improvementPercentage: Number,
    performanceRank: String // Top 10%, Top 25%, etc.
  },

  // Timeline Data
  attemptNumber: Number,
  totalInterviewsAttempted: Number,
  consistencyScore: Number,

  // Tags & Categories
  tags: [String],
  category: String,

  // Export Settings
  isGeneratedPDF: { type: Boolean, default: false },
  pdfUrl: String,
  downloadedAt: Date,

  // Metrics
  questionsCorrect: Number,
  questionsPartial: Number,
  questionsIncorrect: Number,
  averageTimePerQuestion: Number,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

interviewReportSchema.index({ userId: 1, reportDate: -1 });
interviewReportSchema.index({ userId: 1, targetRole: 1 });

module.exports = mongoose.model('InterviewReport', interviewReportSchema);
