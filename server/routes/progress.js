const express = require('express');
const Progress = require('../models/Progress');
const Submission = require('../models/Submission');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Get user progress
router.get('/', auth, async (req, res) => {
  try {
    let progress = await Progress.findOne({ userId: req.userId })
      .populate('problemsStarted.problemId', 'title difficulty')
      .populate('problemsSolved.problemId', 'title difficulty');

    if (!progress) {
      progress = new Progress({ userId: req.userId });
      await progress.save();
    }

    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user statistics
router.get('/stats/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const progress = await Progress.findOne({ userId: req.userId });
    const submissions = await Submission.find({ userId: req.userId });

    const stats = {
      userStats: {
        totalSubmissions: submissions.length,
        acceptedSubmissions: submissions.filter(s => s.status === 'Accepted').length,
        solvedProblems: progress?.problemsSolved?.length || 0,
        attemptedProblems: progress?.problemsStarted?.length || 0,
        streak: progress?.streakData?.currentStreak || 0,
        totalTimeSpent: progress?.totalTimeSpent || 0,
        accuracyRate: user?.statistics?.averageAccuracy || 0
      },
      categoryProgress: progress?.categoryProgress || {},
      difficultyProgress: progress?.difficultyProgress || {}
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update progress after solving problem
router.post('/update', auth, async (req, res) => {
  try {
    const { problemId, solved, timeSpent, hintsUsed, language, category, difficulty, testsPassed = 0 } = req.body;
    // Default to 5 minutes if client didn't send time; minimum 1 minute
    const minutesSpent = Math.max(1, Math.round(Number(timeSpent) || 5));

    let progress = await Progress.findOne({ userId: req.userId });
    if (!progress) {
      progress = new Progress({ userId: req.userId });
    }

    const normalizedExternalId = String(problemId || '').trim() || null;
    const normalizedObjectId = normalizedExternalId && mongoose.Types.ObjectId.isValid(normalizedExternalId)
      ? new mongoose.Types.ObjectId(normalizedExternalId)
      : null;

    const matchByRef = (entry) => {
      if (!entry) return false;
      if (normalizedObjectId && entry.problemId) {
        return String(entry.problemId) === String(normalizedObjectId);
      }
      return Boolean(normalizedExternalId) && entry.externalQuestionId === normalizedExternalId;
    };

    const startedIndex = progress.problemsStarted.findIndex(matchByRef);
    if (startedIndex === -1) {
      progress.problemsStarted.push({
        problemId: normalizedObjectId,
        externalQuestionId: normalizedObjectId ? null : normalizedExternalId,
        startedAt: new Date(),
        status: solved ? 'Solved' : 'Attempted'
      });
    } else {
      progress.problemsStarted[startedIndex].status = solved ? 'Solved' : 'Attempted';
    }

    if (solved) {
      const solvedExists = progress.problemsSolved.some(matchByRef);
      if (!solvedExists) {
        progress.problemsSolved.push({
          problemId: normalizedObjectId,
          externalQuestionId: normalizedObjectId ? null : normalizedExternalId,
          solvedAt: new Date(),
          hintsUsed,
          timeSpent: minutesSpent,
          language,
          submissions: 1
        });
      }

      const today = new Date().setHours(0, 0, 0, 0);
      const lastSolvedDate = progress.streakData.lastSolvedDate
        ? new Date(progress.streakData.lastSolvedDate).setHours(0, 0, 0, 0)
        : null;

      if (lastSolvedDate !== today) {
        if (lastSolvedDate === today - 86400000) {
          progress.streakData.currentStreak++;
        } else {
          progress.streakData.currentStreak = 1;
          progress.streakData.streakStartDate = new Date();
        }
        progress.streakData.lastSolvedDate = new Date();
      }

      progress.streakData.longestStreak = Math.max(
        progress.streakData.longestStreak || 0,
        progress.streakData.currentStreak || 0
      );
    }

    progress.totalTimeSpent = (progress.totalTimeSpent || 0) + minutesSpent;

    if (category) {
      const key = String(category).toLowerCase();
      const existing = progress.categoryProgress[key] || { attempted: 0, solved: 0 };
      existing.attempted = progress.problemsStarted.filter((p) => p.status !== 'Not Started').length;
      existing.solved = progress.problemsSolved.length;
      progress.categoryProgress[key] = existing;
    }

    if (difficulty) {
      const difficultyKey = String(difficulty).toLowerCase();
      if (['easy', 'medium', 'hard'].includes(difficultyKey)) {
        const curr = progress.difficultyProgress[difficultyKey] || { attempted: 0, solved: 0 };
        curr.attempted = (curr.attempted || 0) + 1;
        if (solved) curr.solved = (curr.solved || 0) + 1;
        progress.difficultyProgress[difficultyKey] = curr;
      }
    }

    const user = await User.findById(req.userId);
    if (user) {
      const solvedCount = progress.problemsSolved.length;
      const attemptedCount = progress.problemsStarted.length;
      const accuracy = attemptedCount > 0 ? Math.round((solvedCount / attemptedCount) * 100) : 0;

      user.statistics.solvedProblems = solvedCount;
      user.statistics.attemptedProblems = attemptedCount;
      user.statistics.averageAccuracy = accuracy;
      user.statistics.streak = progress.streakData.currentStreak || 0;
      user.statistics.totalTestsPassed = (user.statistics.totalTestsPassed || 0) + Number(testsPassed || 0);
      if (solved) user.statistics.lastSolvedDate = new Date();

      if (solvedCount >= 100) user.rank = 'Expert';
      else if (solvedCount >= 50) user.rank = 'Advanced';
      else if (solvedCount >= 20) user.rank = 'Intermediate';
      else user.rank = 'Beginner';

      await user.save();
    }

    progress.lastUpdated = new Date();
    await progress.save();

    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find()
      .select('name avatar statistics rank')
      .sort({ 'statistics.solvedProblems': -1 })
      .limit(100);

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
