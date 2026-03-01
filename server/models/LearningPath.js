const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Target role and company
  targetRole: { type: String, required: true },
  targetCompany: String,
  targetSalary: String,
  
  // Current level assessment
  currentLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  yearsOfExperience: Number,
  skills: [String],
  weakAreas: [String],
  
  // Personalized roadmap
  roadmap: [{
    phase: Number,
    phaseTitle: String,
    duration: String, // e.g., "2 weeks"
    topics: [{
      topicName: String,
      subtopics: [String],
      estimatedHours: Number,
      resources: [String],
      priority: { type: String, enum: ['High', 'Medium', 'Low'] }
    }],
    problems: [mongoose.Schema.Types.ObjectId],
    mockInterviews: Number,
    estimatedStartDate: Date,
    estimatedEndDate: Date,
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    completionPercentage: { type: Number, 0: 100, default: 0 }
  }],
  
  // Week-by-week schedule
  weeklySchedule: [{
    week: Number,
    topics: [String],
    targetPracticeHours: Number,
    mockInterviewsToTake: Number,
    focus: String
  }],
  
  // Recommended resources
  resources: [{
    type: String, // article, video, problem, mock interview
    title: String,
    url: String,
    duration: Number, // in minutes
    difficulty: String,
    relevanceScore: Number,
    completedAt: Date
  }],
  
  // Progress tracking
  progressMetrics: {
    totalHoursTarget: Number,
    totalHoursCompleted: { type: Number, default: 0 },
    topicsTarget: Number,
    topicsCompleted: { type: Number, default: 0 },
    mockInterviewsTarget: Number,
    mockInterviewsCompleted: { type: Number, default: 0 },
    estimatedReadinessPercentage: { type: Number, 0: 100, default: 0 },
    daysRemaining: Number
  },
  
  // Milestones
  milestones: [{
    milestoneName: String,
    description: String,
    targetDate: Date,
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'] },
    completedAt: Date
  }],
  
  // AI generated insights
  aiInsights: {
    estimatedTimeToReady: String,
    successProbability: Number,
    recommendedFocusAreas: [String],
    paceRecommendation: String, // "You're on pace", "Need to speed up"
    personalizedAdvice: String
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

module.exports = mongoose.model('LearningPath', learningPathSchema);
