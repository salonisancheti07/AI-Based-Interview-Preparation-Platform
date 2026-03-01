const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interviewType: {
    type: String,
    enum: ['technical', 'behavioral', 'hr', 'mixed'],
    required: true
  },
  targetRole: {
    type: String,
    required: true // e.g., "Senior Frontend Developer", "DevOps Engineer"
  },
  targetCompany: String,
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  
  // Interview session details
  questions: [{
    questionId: mongoose.Schema.Types.ObjectId,
    question: String,
    category: String, // technical, behavioral, hr
    difficulty: String,
    aiGenerated: { type: Boolean, default: false },
    fromResume: { type: Boolean, default: false }
  }],
  
  userAnswers: [{
    questionIndex: Number,
    question: String,
    userAnswer: String,
    audioTranscript: String, // If voice answer
    answerType: { type: String, enum: ['text', 'code', 'voice'], default: 'text' },
    submittedAt: Date,
    timeSpent: Number // in seconds
  }],
  
  // AI Evaluation
  aiEvaluation: {
    answers: [{
      questionIndex: Number,
      correctness: { type: Number, 0: 100 }, // 0-100 score
      relevance: { type: Number, 0: 100 },
      completeness: { type: Number, 0: 100 },
      clarity: { type: Number, 0: 100 },
      optimization: { type: Number, 0: 100 }, // For coding
      
      // Behavioral scoring
      confidence: { type: Number, 0: 100 },
      communication: { type: Number, 0: 100 },
      grammar: { type: Number, 0: 100 },
      structure: { type: Number, 0: 100 },
      
      feedback: String,
      strengths: [String],
      improvements: [String],
      followUpQuestions: [String],
      
      evaluatedAt: Date
    }],
    
    overallScore: { type: Number, 0: 100 },
    readinessScore: { type: Number, 0: 100 }, // Likelihood of passing real interview
    confidenceScore: { type: Number, 0: 100 }, // Based on answers
    communicationScore: { type: Number, 0: 100 }, // Overall quality
    
    summaryFeedback: String,
    recommendations: [String],
    topStrengths: [String],
    areasToImprove: [String]
  },
  
  // Interview metrics
  metrics: {
    totalQuestions: Number,
    answered: Number,
    skipped: Number,
    totalTime: Number, // in minutes
    averageTimePerQuestion: Number,
    interruptedCount: Number // Times user paused/interrupted
  },
  
  // Adaptive AI Engine
  adaptiveState: {
    currentDifficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
    consecutiveCorrect: { type: Number, default: 0 },
    consecutiveIncorrect: { type: Number, default: 0 },
    hintsProvided: { type: Number, default: 0 },
    difficultyAdjustments: { type: Number, default: 0 },
    performancePattern: [String] // Track 'correct', 'incorrect', 'hint_used'
  },
  
  // Session info
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Abandoned'],
    default: 'In Progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  // Post-interview
  aiInsights: {
    careerGuidance: String,
    roleReadiness: String,
    nextSteps: [String],
    recommendedTopics: [String]
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

mockInterviewSchema.index({ userId: 1, completedAt: -1 });
mockInterviewSchema.index({ targetRole: 1 });

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
