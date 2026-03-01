const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  googleId: {
    type: String,
    default: null
  },
  githubId: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'recruiter', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: function requiredPassword() {
      return this.authProvider === 'local';
    },
    minlength: 6
  },
  avatar: {
    type: String,
    default: '👤'
  },
  banner: {
    type: String,
    default: ''
  },
  resume: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  targetRole: {
    type: String,
    default: ''
  },
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  companyGoal: {
    type: String,
    default: ''
  },
  statistics: {
    totalProblems: { type: Number, default: 0 },
    solvedProblems: { type: Number, default: 0 },
    attemptedProblems: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    totalTestsPassed: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastSolvedDate: Date
  },
  rank: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  bookmarkedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  preferredLanguages: {
    type: [String],
    default: ['javascript'],
    enum: ['javascript', 'python', 'java', 'cpp', 'csharp', 'golang', 'typescript', 'rust', 'sql']
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    dailyReminders: { type: Boolean, default: true },
    shareProgress: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    weeklyGoal: { type: Number, default: 5 }
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.password) return next();
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Don't return password in responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
