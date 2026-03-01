const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');
const Submission = require('../models/Submission');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const [user, progress, submissions] = await Promise.all([
      User.findById(req.userId).select('statistics rank'),
      Progress.findOne({ userId: req.userId }),
      Submission.find({ userId: req.userId })
        .select('category status submittedAt result')
        .sort({ submittedAt: -1 })
        .limit(500)
    ]);

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter((submission) => submission.status === 'Accepted').length;
    const solvedProblems = progress?.problemsSolved?.length || user?.statistics?.solvedProblems || 0;
    const attemptedProblems = progress?.problemsStarted?.length || user?.statistics?.attemptedProblems || totalSubmissions;
    const accuracy = attemptedProblems > 0 ? Math.round((solvedProblems / attemptedProblems) * 100) : 0;
    const confidence = Math.max(10, Math.min(100, Math.round((accuracy * 0.7) + ((acceptedSubmissions / Math.max(totalSubmissions, 1)) * 30))));
    const overallReadiness = Math.max(
      5,
      Math.min(100, Math.round((accuracy * 0.55) + (confidence * 0.25) + (Math.min(solvedProblems, 100) * 0.2)))
    );

    const categoryMap = {};
    submissions.forEach((submission) => {
      const key = (submission.category || 'general').toLowerCase();
      if (!categoryMap[key]) {
        categoryMap[key] = { category: key, attempts: 0, accepted: 0 };
      }
      categoryMap[key].attempts += 1;
      if (submission.status === 'Accepted') categoryMap[key].accepted += 1;
    });

    const categoryPerformance = Object.values(categoryMap).map((item) => {
      const averageScore = item.attempts > 0 ? Math.round((item.accepted / item.attempts) * 100) : 0;
      const improvementRate = Math.max(-20, Math.min(30, Math.round((averageScore - 50) / 2)));
      return {
        category: item.category.toUpperCase(),
        averageScore,
        questionsAttempted: item.attempts,
        improvementRate
      };
    });

    const weakTopics = categoryPerformance
      .filter((item) => item.averageScore < 65)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 4)
      .map((item) => ({
        topic: item.category,
        averageScore: item.averageScore,
        questionsAttempted: item.questionsAttempted,
        priority: item.averageScore < 40 ? 'High' : 'Medium'
      }));

    const strongTopics = categoryPerformance
      .filter((item) => item.averageScore >= 75)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 4)
      .map((item) => ({
        topic: item.category,
        averageScore: item.averageScore,
        questionsAttempted: item.questionsAttempted
      }));

    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekBuckets = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      return {
        dateKey: date.toISOString().slice(0, 10),
        day: dayNames[date.getDay()],
        solved: 0,
        submitted: 0
      };
    });

    const bucketMap = Object.fromEntries(weekBuckets.map((bucket) => [bucket.dateKey, bucket]));
    submissions.forEach((submission) => {
      const dateKey = new Date(submission.submittedAt).toISOString().slice(0, 10);
      if (!bucketMap[dateKey]) return;
      bucketMap[dateKey].submitted += 1;
      if (submission.status === 'Accepted') bucketMap[dateKey].solved += 1;
    });

    const weeklyProgress = weekBuckets.map((bucket) => {
      const score = bucket.submitted > 0 ? Math.round((bucket.solved / bucket.submitted) * 100) : 0;
      return { day: bucket.day, score, solved: bucket.solved, submitted: bucket.submitted };
    });

    const aiRecommendations = [];
    if (weakTopics.length) {
      aiRecommendations.push(`Focus on ${weakTopics[0].topic} first. Solve 3-5 medium problems daily this week.`);
    }
    if ((progress?.streakData?.currentStreak || 0) < 3) {
      aiRecommendations.push('Build a 3-day streak by solving at least one problem every day.');
    }
    if (accuracy < 70) {
      aiRecommendations.push('Use Run before Submit and validate edge cases (empty input, duplicates, large values).');
    }
    if (!aiRecommendations.length) {
      aiRecommendations.push('Great consistency. Move to harder timed sets and mock interviews to accelerate growth.');
    }

    const nextMilestoneSolved = solvedProblems < 25 ? 25 : solvedProblems < 50 ? 50 : solvedProblems < 100 ? 100 : solvedProblems + 50;

    res.json({
      success: true,
      data: {
        overallReadiness,
        confidence,
        totalSubmissions,
        acceptedSubmissions,
        solvedProblems,
        attemptedProblems,
        accuracy,
        currentStreak: progress?.streakData?.currentStreak || 0,
        longestStreak: progress?.streakData?.longestStreak || 0,
        totalTimeSpent: (() => {
          const tracked = progress?.totalTimeSpent || 0;
          if (tracked > 0) return tracked;
          // Fallback: estimate 3 minutes per solved, 1 per attempted
          const estimate = Math.max(solvedProblems * 3, attemptedProblems * 1, totalSubmissions * 1);
          return estimate;
        })(),
        categoryPerformance,
        weakTopics,
        strongTopics,
        weeklyProgress,
        aiRecommendations,
        rank: user?.rank || 'Beginner',
        nextMilestoneSolved
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
