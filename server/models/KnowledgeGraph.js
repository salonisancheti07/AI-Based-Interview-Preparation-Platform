const mongoose = require('mongoose');

const knowledgeGraphSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Topic metadata
  category: {
    type: String,
    enum: ['technical', 'behavioral', 'system-design', 'algorithms', 'data-structures'],
    required: true
  },
  
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  
  // Prerequisites and dependencies
  prerequisites: [{
    topic: String,
    strength: { type: Number, min: 0, max: 1, default: 1 } // How strongly required
  }],
  
  // Topics that depend on this
  dependentTopics: [{
    topic: String,
    strength: { type: Number, min: 0, max: 1, default: 1 }
  }],
  
  // Related topics
  relatedTopics: [{
    topic: String,
    relationship: {
      type: String,
      enum: ['similar', 'complementary', 'alternative', 'advanced'],
      default: 'similar'
    },
    strength: { type: Number, min: 0, max: 1, default: 0.5 }
  }],
  
  // Learning resources
  resources: [{
    type: { type: String, enum: ['video', 'article', 'practice', 'exercise'] },
    title: String,
    url: String,
    difficulty: String,
    estimatedTime: Number // in minutes
  }],
  
  // Performance metrics
  userPerformance: {
    averageScore: { type: Number, 0: 100, default: 0 },
    timesPracticed: { type: Number, default: 0 },
    successRate: { type: Number, 0: 100, default: 0 }
  },
  
  // AI-generated insights
  aiInsights: {
    commonMistakes: [String],
    learningPatterns: [String],
    recommendedOrder: Number, // Position in learning sequence
    difficultyProgression: [String] // How difficulty should increase
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

// Indexes for efficient queries
knowledgeGraphSchema.index({ category: 1, difficulty: 1 });
knowledgeGraphSchema.index({ 'prerequisites.topic': 1 });
knowledgeGraphSchema.index({ 'aiInsights.recommendedOrder': 1 });

module.exports = mongoose.model('KnowledgeGraph', knowledgeGraphSchema);