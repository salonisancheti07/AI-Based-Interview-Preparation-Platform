const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  problemNumber: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    unique: true
  },
  leetcodeId: String,
  category: {
    type: String,
    required: true,
    enum: ['dsa', 'html', 'javascript', 'react', 'node', 'database', 'system-design', 'behavioral'],
    index: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    index: true
  },
  description: String,
  problemDetails: {
    statement: String,
    example: String,
    constraints: String,
    followUp: String
  },
  explanation: String,
  timeComplexity: String,
  spaceComplexity: String,
  topics: [String],
  relatedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  
  // Code solution templates
  codeTemplates: {
    javascript: {
      starter: String,
      solution: String
    },
    python: {
      starter: String,
      solution: String
    },
    java: {
      starter: String,
      solution: String
    }
  },
  
  // Test cases
  testCases: [{
    input: String,
    output: String,
    explanation: String,
    isHidden: { type: Boolean, default: false }
  }],
  
  // Hints system
  hints: [{
    level: { type: Number, enum: [1, 2, 3] },
    hint: String,
    approach: String
  }],
  
  // Statistics
  statistics: {
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },
    averageRuntime: { type: Number, default: 0 },
    averageMemory: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
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

problemSchema.index({ category: 1, difficulty: 1 });
problemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Problem', problemSchema);
