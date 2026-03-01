const mongoose = require('mongoose');

const peerPracticeSchema = new mongoose.Schema({
  // Session Details
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  creatorName: String,
  sessionTitle: String,
  sessionDescription: String,
  sessionType: { type: String, enum: ['technical', 'behavioral', 'mock-interview'] },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },

  // Participants
  participants: [{
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    role: { type: String, enum: ['interviewer', 'candidate', 'observer'] },
    joinedAt: Date,
    performance: {
      score: Number,
      feedback: String,
      rating: Number
    }
  }],

  maxParticipants: { type: Number, default: 2 },
  
  // Interview Setup
  topic: String,
  duration: Number, // in minutes
  questions: [{
    question: String,
    category: String,
    expectedTime: Number
  }],

  // Interview Progress
  status: { 
    type: String, 
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  
  startTime: Date,
  endTime: Date,
  actualDuration: Number,

  // Candidate Responses
  candidateResponses: [{
    questionIndex: Number,
    question: String,
    response: String,
    audioUrl: String,
    videoUrl: String,
    timeSpent: Number
  }],

  // Feedback Exchange
  feedback: [{
    from: mongoose.Schema.Types.ObjectId,
    to: mongoose.Schema.Types.ObjectId,
    feedbackText: String,
    rating: { type: Number, min: 1, max: 5 },
    category: { type: String, enum: ['communication', 'technical', 'clarity', 'overall'] },
    createdAt: { type: Date, default: Date.now }
  }],

  // Overall Session Feedback
  sessionFeedback: {
    candidatePerformance: Number,
    interviewerQuality: Number,
    sessionProductivity: Number,
    suggestions: [String]
  },

  // Recording
  recordingUrl: String,
  isRecorded: { type: Boolean, default: false },
  recordingConsent: { type: Boolean, default: false },

  // Visibility
  isPublic: { type: Boolean, default: false },
  canShareFeedback: { type: Boolean, default: true },

  // Tags & Categories
  tags: [String],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

peerPracticeSchema.index({ createdBy: 1, createdAt: -1 });
peerPracticeSchema.index({ status: 1 });
peerPracticeSchema.index({ 'participants.userId': 1 });

module.exports = mongoose.model('PeerPractice', peerPracticeSchema);
