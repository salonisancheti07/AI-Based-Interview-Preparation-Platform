const mongoose = require('mongoose');

const companyPrepSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    unique: true
  },

  // Company Info
  industry: String,
  headquarter: String,
  founded: Number,
  employees: String,
  website: String,
  description: String,
  logo: String,

  // Interview Process
  interviewProcess: {
    rounds: Number,
    duration: String,
    types: [String], // online test, phone, onsite, etc.
    description: String
  },

  // Positions Available
  positions: [{
    title: String,
    level: { type: String, enum: ['Intern', 'Junior', 'Mid', 'Senior', 'Lead'] },
    salaryRange: String,
    description: String
  }],

  // Common Questions Database
  questionsDatabase: [{
    question: String,
    category: { type: String, enum: ['technical', 'behavioral', 'hr'] },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    topic: String,
    expectedAnswer: String,
    followUpQuestions: [String],
    frequency: { type: Number, default: 0 }, // How often asked
    reportedCount: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
    year: Number,
    createdAt: { type: Date, default: Date.now }
  }],

  // Interview Tips
  interviewTips: [String],

  // Company Culture & Values
  culture: [String],
  values: [String],

  // Recent Interview Experiences (from users)
  userExperiences: [{
    userId: mongoose.Schema.Types.ObjectId,
    position: String,
    round: String,
    experience: String,
    rating: { type: Number, min: 1, max: 5 },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    result: { type: String, enum: ['Selected', 'Rejected', 'Pending'] },
    createdAt: { type: Date, default: Date.now }
  }],

  // Statistics
  totalQuestionsCollected: { type: Number, default: 0 },
  averageDifficulty: Number,
  selectionRate: Number,
  averageInterviewRating: Number,

  // Resources
  prepResources: [{
    title: String,
    type: { type: String, enum: ['Article', 'Video', 'Course', 'Book'] },
    url: String,
    difficulty: String
  }],

  // Tags
  tags: [String],

  // Status
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

companyPrepSchema.index({ company: 1 });
companyPrepSchema.index({ 'questionsDatabase.category': 1 });
companyPrepSchema.index({ tags: 1 });

module.exports = mongoose.model('CompanyPrep', companyPrepSchema);
