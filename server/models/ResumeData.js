const mongoose = require('mongoose');

const resumeDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // File info
  fileUrl: String,
  fileName: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // Parsed resume data
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    portfolio: String,
    linkedin: String,
    github: String
  },
  
  // Professional summary
  summary: String,
  
  // Experience
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String,
    achievements: [String],
    skills: [String]
  }],
  
  // Education
  education: [{
    institution: String,
    degree: String,
    field: String,
    graduationDate: Date,
    gpa: String,
    achievements: [String]
  }],
  
  // Skills
  skills: [{
    skillName: String,
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    yearsOfExperience: Number,
    endorsements: Number
  }],
  
  // Projects
  projects: [{
    projectName: String,
    description: String,
    technologies: [String],
    link: String,
    impact: String
  }],
  
  // Certifications
  certifications: [{
    certificationName: String,
    issuer: String,
    date: Date,
    credentialUrl: String
  }],
  
  // AI-generated insights
  aiInsights: {
    detectedRoles: [String], // AI predicted suitable roles
    technicalSkills: [String],
    softSkills: [String],
    experienceLevel: String,
    strongPoints: [String],
    areasToHighlight: [String],
    resumeStrength: { type: Number, 0: 100 }, // Overall resume quality score
    improvementSuggestions: [String],
    industryMatch: [{ industry: String, matchPercentage: Number }]
  },
  
  // AI-generated questions
  generatedQuestions: [{
    question: String,
    category: { type: String, enum: ['technical', 'behavioral', 'hr', 'experience-based'] },
    difficulty: String,
    relevance: String, // How it relates to resume
    generatedAt: Date
  }],
  
  // Version tracking
  resumeVersion: { type: Number, default: 1 },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ResumeData', resumeDataSchema);
