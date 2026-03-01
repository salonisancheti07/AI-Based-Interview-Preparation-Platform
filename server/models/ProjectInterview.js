const mongoose = require('mongoose');

const projectInterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Project details
  projectType: {
    type: String,
    enum: ['system-design', 'ml-fraud-detection', 'chat-system', 'instagram-backend', 'ecommerce-platform', 'custom'],
    required: true
  },
  
  projectTitle: {
    type: String,
    required: true
  },
  
  projectDescription: {
    type: String,
    required: true
  },
  
  // Interview phases
  phases: [{
    phaseName: String, // e.g., "Requirements Gathering", "High-Level Design", "Detailed Design", "Implementation"
    questions: [{
      question: String,
      category: { type: String, enum: ['requirements', 'design', 'architecture', 'scalability', 'tradeoffs', 'implementation'] },
      difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
      expectedDuration: Number, // in minutes
      hints: [String],
      evaluationCriteria: [String]
    }],
    completed: { type: Boolean, default: false },
    timeSpent: Number
  }],
  
  // User responses
  responses: [{
    phaseIndex: Number,
    questionIndex: Number,
    response: String,
    audioUrl: String,
    diagrams: [String], // URLs to architecture diagrams
    codeSnippets: [String],
    submittedAt: Date,
    timeSpent: Number
  }],
  
  // AI Evaluation
  aiEvaluation: {
    overallScore: { type: Number, 0: 100 },
    phaseScores: [{
      phaseIndex: Number,
      score: Number,
      feedback: String,
      strengths: [String],
      improvements: [String]
    }],
    technicalCompetence: { type: Number, 0: 100 },
    systemThinking: { type: Number, 0: 100 },
    communicationClarity: { type: Number, 0: 100 },
    summaryFeedback: String,
    recommendedFocusAreas: [String]
  },
  
  // Session tracking
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Abandoned'],
    default: 'In Progress'
  },
  
  currentPhase: {
    type: Number,
    default: 0
  },
  
  totalTimeSpent: Number,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  // Metadata
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  
  tags: [String],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

projectInterviewSchema.index({ userId: 1, status: 1 });
projectInterviewSchema.index({ projectType: 1 });

module.exports = mongoose.model('ProjectInterview', projectInterviewSchema);