const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  sessionType: {
    type: String,
    enum: ['doubt-solving', 'concept-explanation', 'career-guidance', 'interview-prep'],
    required: true
  },
  
  topic: String, // e.g., "Binary Search", "JavaScript Closures"
  difficulty: String,
  
  // Conversation history
  messages: [{
    sender: { type: String, enum: ['user', 'ai'], required: true },
    message: String,
    timestamp: { type: Date, default: Date.now },
    
    // AI context
    aiModel: String, // GPT-4, Claude, etc.
    confidence: Number, // 0-100 for AI confidence
    resources: [String], // Links to concepts, tutorials
    codeExample: String, // If applicable
    
    // User feedback on AI response
    feedback: { type: String, enum: ['helpful', 'not-helpful', 'partially'] },
    rating: { type: Number, 0: 5 }
  }],
  
  // Learning outcome
  learningOutcome: {
    conceptsLearned: [String],
    clarityLevel: { type: Number, 0: 100 }, // How well user understood
    problemsSolved: { type: Number, default: 0 },
    timeSpent: Number, // in minutes
    satisfaction: { type: Number, 0: 5 }
  },
  
  // Session metadata
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  totalDuration: Number, // in seconds
  messageCount: Number,
  
  // AI insights
  aiSummary: {
    mainConcepts: [String],
    clarifications: [String],
    misconceptions: [String],
    nextTopicsSuggestion: [String]
  },
  
  // Rating and feedback
  sessionRating: { type: Number, 0: 5 },
  userFeedback: String,
  isHelpful: Boolean,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ topic: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
