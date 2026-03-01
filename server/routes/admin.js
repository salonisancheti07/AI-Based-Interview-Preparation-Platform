const express = require('express');
const Problem = require('../models/Problem');
const User = require('../models/User');
const MockInterview = require('../models/MockInterview');
const UserPerformance = require('../models/UserPerformance');
const PeerPractice = require('../models/PeerPractice');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const totalProblems = await Problem.countDocuments();
    const totalUsers = await User.countDocuments();
    const easyProblems = await Problem.countDocuments({ difficulty: 'Easy' });
    const mediumProblems = await Problem.countDocuments({ difficulty: 'Medium' });
    const hardProblems = await Problem.countDocuments({ difficulty: 'Hard' });

    res.json({
      success: true,
      stats: {
        totalProblems,
        totalUsers,
        difficultyDistribution: {
          easy: easyProblems,
          medium: mediumProblems,
          hard: hardProblems
        },
        categories: ['dsa', 'html', 'javascript', 'react', 'node', 'database', 'system-design', 'behavioral']
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Interview Analytics Dashboard
router.get('/interview-analytics', auth, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    // Overall interview statistics
    const totalInterviews = await MockInterview.countDocuments({ status: 'Completed' });
    const averageScore = await MockInterview.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
    ]);

    // Most failed topics
    const failedTopics = await MockInterview.aggregate([
      { $match: { status: 'Completed' } },
      { $unwind: '$aiEvaluation.answers' },
      { $match: { 'aiEvaluation.answers.correctness': { $lt: 60 } } },
      { $group: { _id: '$questions.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Common mistakes analysis
    const commonMistakes = await analyzeCommonMistakes();

    // User performance trends
    const performanceTrends = await getPerformanceTrends();

    // Interview success rates by role
    const roleSuccessRates = await MockInterview.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { 
        _id: '$targetRole', 
        total: { $sum: 1 },
        successful: { $sum: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] } }
      }},
      { $project: {
        role: '$_id',
        successRate: { $multiply: [{ $divide: ['$successful', '$total'] }, 100] },
        totalInterviews: '$total'
      }},
      { $sort: { totalInterviews: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        overview: {
          totalInterviews,
          averageScore: averageScore[0]?.avgScore || 0,
          completionRate: await calculateCompletionRate()
        },
        failedTopics,
        commonMistakes,
        performanceTrends,
        roleSuccessRates,
        userEngagement: await getUserEngagementMetrics()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get detailed user performance data
router.get('/user-performance/:userId', auth, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const interviews = await MockInterview.find({ 
      userId, 
      status: 'Completed' 
    }).sort({ completedAt: -1 });
    
    const performance = await UserPerformance.findOne({ userId });
    
    const analytics = {
      interviewHistory: interviews.map(i => ({
        id: i._id,
        role: i.targetRole,
        score: i.overallScore,
        date: i.completedAt,
        difficulty: i.difficulty
      })),
      skillProfile: performance ? {
        technical: performance.categoryPerformance.technical,
        behavioral: performance.categoryPerformance.behavioral,
        coding: performance.categoryPerformance.coding
      } : null,
      improvement: calculateImprovementTrend(interviews)
    };
    
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Analytics Helper Functions
async function analyzeCommonMistakes() {
  // Analyze common mistakes from interview feedback
  const interviews = await MockInterview.find({ status: 'Completed' })
    .select('aiEvaluation.answers.improvements areasToImprove')
    .limit(100);

  const mistakeCounts = {};
  
  interviews.forEach(interview => {
    const improvements = interview.areasToImprove || [];
    improvements.forEach(improvement => {
      mistakeCounts[improvement] = (mistakeCounts[improvement] || 0) + 1;
    });
  });

  return Object.entries(mistakeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([mistake, count]) => ({ mistake, frequency: count }));
}

async function getPerformanceTrends() {
  // Get performance trends over time
  const monthlyStats = await MockInterview.aggregate([
    { $match: { status: 'Completed' } },
    { $group: {
      _id: {
        year: { $year: '$completedAt' },
        month: { $month: '$completedAt' }
      },
      averageScore: { $avg: '$overallScore' },
      totalInterviews: { $sum: 1 },
      passRate: { $avg: { $cond: [{ $gte: ['$overallScore', 70] }, 1, 0] } }
    }},
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  return monthlyStats.map(stat => ({
    period: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
    averageScore: Math.round(stat.averageScore),
    totalInterviews: stat.totalInterviews,
    passRate: Math.round(stat.passRate * 100)
  }));
}

async function calculateCompletionRate() {
  const totalStarted = await MockInterview.countDocuments();
  const totalCompleted = await MockInterview.countDocuments({ status: 'Completed' });
  
  return totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;
}

async function getUserEngagementMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const activeUsers = await MockInterview.distinct('userId', {
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  const peerSessions = await PeerPractice.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  return {
    activeUsersLast30Days: activeUsers.length,
    peerSessionsLast30Days: peerSessions,
    averageInterviewsPerUser: await calculateAverageInterviewsPerUser()
  };
}

async function calculateAverageInterviewsPerUser() {
  const result = await MockInterview.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $group: { _id: null, avg: { $avg: '$count' } } }
  ]);
  
  return result[0]?.avg || 0;
}

function calculateImprovementTrend(interviews) {
  if (interviews.length < 2) return null;
  
  const sorted = interviews.sort((a, b) => a.completedAt - b.completedAt);
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, i) => sum + (i.overallScore || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, i) => sum + (i.overallScore || 0), 0) / secondHalf.length;
  
  return {
    improvement: Math.round(secondAvg - firstAvg),
    trend: secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable'
  };
}

module.exports = router;
