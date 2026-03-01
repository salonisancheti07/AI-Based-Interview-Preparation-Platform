const mongoose = require('mongoose');

const resumeBuilderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Info
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    portfolio: String,
    linkedIn: String,
    github: String
  },

  // Professional Summary
  summary: String,

  // Experience
  experience: [{
    company: String,
    position: String,
    employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Freelance', 'Contract'] },
    location: String,
    startDate: Date,
    endDate: Date,
    currentlyWorking: { type: Boolean, default: false },
    description: String,
    keyAchievements: [String],
    skills: [String],
    createdAt: { type: Date, default: Date.now }
  }],

  // Education
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    grade: String,
    activities: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Skills
  skills: [{
    skill: String,
    proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    yearsOfExperience: Number,
    endorsements: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],

  // Projects
  projects: [{
    projectName: String,
    description: String,
    technologiesUsed: [String],
    link: String,
    startDate: Date,
    endDate: Date,
    impact: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Certifications
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Versions & Templates
  templateUsed: { type: String, default: 'modern' }, // modern, classic, creative
  versions: [{ 
    versionNumber: Number,
    createdAt: Date,
    title: String
  }],

  // Metadata
  isPublic: { type: Boolean, default: false },
  isPrimary: { type: Boolean, default: false },
  lastModified: { type: Date, default: Date.now },
  downloadCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

resumeBuilderSchema.index({ userId: 1, createdAt: -1 });
resumeBuilderSchema.index({ userId: 1, isPrimary: 1 });

module.exports = mongoose.model('ResumeBuilder', resumeBuilderSchema);
