const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Points System
  points: {
    totalPoints: { type: Number, default: 0 },
    dailyPoints: { type: Number, default: 0 },
    weeklyPoints: { type: Number, default: 0 },
    monthlyPoints: { type: Number, default: 0 },
    allTimeHighScore: { type: Number, default: 0 }
  },

  // Badges
  badges: [{
    badgeId: String,
    badgeName: String,
    description: String,
    icon: String,
    earnedAt: Date,
    rarity: { type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary'] }
  }],

  // Achievements
  achievements: [{
    achievementId: String,
    achievementName: String,
    description: String,
    progressValue: { type: Number, default: 0 },
    targetValue: Number,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    tier: { type: Number, default: 1 }
  }],

  // Level System
  level: { type: Number, default: 1 },
  experiencePoints: { type: Number, default: 0 },
  nextLevelXP: { type: Number, default: 1000 },
  levelProgression: [{
    level: Number,
    xpEarned: Number,
    dateAchieved: Date
  }],

  // Streaks
  streaks: {
    currentDailyStreak: { type: Number, default: 0 },
    longestDailyStreak: { type: Number, default: 0 },
    currentWeeklyStreak: { type: Number, default: 0 },
    longestWeeklyStreak: { type: Number, default: 0 },
    currentPracticeDays: { type: Number, default: 0 }
  },

  // Leaderboard Data
  globalRank: { type: Number, default: 0 },
  regionalRank: { type: Number, default: 0 },
  allTimeRank: { type: Number, default: 0 },
  weeklyRank: { type: Number, default: 0 },

  // Challenge Participation
  activeChallenges: [{
    challengeId: String,
    challengeName: String,
    progress: Number,
    target: Number,
    reward: Number,
    status: { type: String, enum: ['In Progress', 'Completed', 'Failed'] },
    startedAt: Date,
    completedAt: Date
  }],

  completedChallenges: { type: Number, default: 0 },
  failedChallenges: { type: Number, default: 0 },

  // Rewards
  rewards: [{
    rewardName: String,
    rewardType: { type: String, enum: ['Feature Access', 'Credits', 'Badge'] },
    rewardValue: Number,
    earnedAt: Date,
    redeemedAt: Date,
    isRedeemed: { type: Boolean, default: false }
  }],

  // Social Features
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  friendCount: { type: Number, default: 0 },

  // Statistics
  totalInterviewsCompleted: { type: Number, default: 0 },
  totalQuestionsAnswered: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },

  // Milestone Tracking
  milestones: [{
    milestoneName: String,
    description: String,
    targetValue: Number,
    currentValue: Number,
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],

  // Profile Customization
  title: String, // e.g., "Interview Master", "Rising Star"
  profileBio: String,
  profileImage: String,

  // Notifications
  notificationSettings: {
    enableBadgeNotifications: { type: Boolean, default: true },
    enableLeaderboardNotifications: { type: Boolean, default: true },
    enableStreakReminders: { type: Boolean, default: true }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ 'points.totalPoints': -1 });
gamificationSchema.index({ globalRank: 1 });

module.exports = mongoose.model('Gamification', gamificationSchema);
