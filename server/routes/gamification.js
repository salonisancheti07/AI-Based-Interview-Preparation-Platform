const express = require('express');
const router = express.Router();

// Mock data (persist in memory for demo)
const mockStats = {
  level: 12,
  points: 3420,
  streakDays: 8,
  totalSessions: 45,
  averageScore: 78,
  lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  questionsAnswered: 132,
  friendCount: 5,
  bonusCredits: 12
};

const mockBadges = [
  { id: 1, name: 'Quick Learner', description: 'Complete 5 sessions', earned: true, earnedDate: '2024-01-15', rarity: 'Common' },
  { id: 2, name: 'Problem Solver', description: 'Solve 10 DSA problems', earned: true, earnedDate: '2024-01-10', rarity: 'Rare' },
  { id: 3, name: 'Interview Master', description: 'Complete 20 mock interviews', earned: false, progress: 12, rarity: 'Epic' },
  { id: 4, name: 'Perfect Score', description: 'Get 100% on any session', earned: false, progress: 0, rarity: 'Legendary' },
  { id: 5, name: 'Consistency', description: '30-day streak', earned: false, progress: 8, rarity: 'Rare' },
  { id: 6, name: 'Code Master', description: 'Complete advanced problems', earned: true, earnedDate: '2024-01-05', rarity: 'Epic' }
];

const mockLeaderboard = [
  { rank: 1, name: 'Alex Kumar', points: 5420, level: 15, avatar: '🥇' },
  { rank: 2, name: 'Priya Singh', points: 4890, level: 14, avatar: '🥈' },
  { rank: 3, name: 'Mike Johnson', points: 4120, level: 13, avatar: '🥉' },
  { rank: 4, name: 'You', points: 3420, level: 12, avatar: '👤' },
  { rank: 5, name: 'Sarah Chen', points: 3100, level: 11, avatar: '🎯' },
  { rank: 6, name: 'Dev Patel', points: 2890, level: 10, avatar: '⭐' },
  { rank: 7, name: 'Emma Wilson', points: 2450, level: 9, avatar: '🚀' },
  { rank: 8, name: 'Raj Gupta', points: 2100, level: 8, avatar: '💡' }
];

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockStats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get badges
router.get('/badges', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockBadges
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockLeaderboard
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update points
router.post('/update-points', async (req, res) => {
  try {
    const { points } = req.body;
    mockStats.points += points;
    res.json({
      success: true,
      message: 'Points updated',
      newPoints: mockStats.points
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
