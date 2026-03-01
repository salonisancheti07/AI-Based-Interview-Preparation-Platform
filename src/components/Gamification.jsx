import React, { useEffect, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/Gamification.css';

const normalizeStats = (raw = {}) => ({
  level: raw.level || 1,
  xp: raw.points || 0,
  allTimePoints: raw.points || 0,
  dailyStreak: raw.streakDays || 0,
  globalRank: raw.rank || 0,
  interviewsCompleted: raw.totalSessions || 0,
  questionsAnswered: raw.questionsAnswered || 0,
  timeInvested: raw.timeInvested || 0,
  averageScore: raw.averageScore || 0,
  friendCount: raw.friendCount || 0,
  bonusCredits: raw.premiumCredits || raw.bonusCredits || 0
});

const normalizeBadges = (items = []) =>
  items.map((item, index) => ({
    _id: item.id || `b-${index}`,
    name: item.name || 'Badge',
    rarity: item.rarity || (item.earned ? 'Rare' : 'Common'),
    description: item.description || '',
    earned: Boolean(item.earned),
    earnedDate: item.earnedDate || null,
    requirement: item.progress != null ? `${item.progress}%` : 'milestone'
  }));

const normalizeLeaderboard = (items = []) =>
  items.map((item, index) => ({
    _id: item.id || `l-${index}`,
    username: item.name || 'User',
    level: item.level || 1,
    allTimePoints: item.points || 0
  }));

const getPayload = (response) => (response && typeof response === 'object' && 'data' in response ? response.data : response);
const readData = (response) => {
  const payload = getPayload(response);
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

const fallbackStats = {
  level: 1,
  xp: 0,
  allTimePoints: 0,
  dailyStreak: 0,
  globalRank: 0,
  interviewsCompleted: 0,
  questionsAnswered: 0,
  timeInvested: 0,
  averageScore: 0,
  friendCount: 0,
  bonusCredits: 0
};

export default function Gamification() {
  const [userStats, setUserStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [statsRes, badgesRes, leaderboardRes] = await Promise.allSettled([
          axios.get('/api/gamification/stats'),
          axios.get('/api/gamification/badges'),
          axios.get('/api/gamification/leaderboard')
        ]);

        if (statsRes.status === 'fulfilled') {
          setUserStats(normalizeStats(readData(statsRes.value) || fallbackStats));
        } else {
          setUserStats(fallbackStats);
          setError('Could not load live gamification stats. Showing fallback data.');
        }

        if (badgesRes.status === 'fulfilled') {
          setBadges(normalizeBadges(readData(badgesRes.value) || []));
        } else {
          setBadges([]);
        }

        if (leaderboardRes.status === 'fulfilled') {
          setLeaderboard(normalizeLeaderboard(readData(leaderboardRes.value) || []));
        } else {
          setLeaderboard([]);
        }
      } catch (err) {
        console.error('Error loading gamification:', err);
        setUserStats(fallbackStats);
        setBadges([]);
        setLeaderboard([]);
        setError('Unable to load gamification service right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading">Loading gamification stats...</div>;
  if (!userStats) return <div className="loading">Unable to load gamification data.</div>;

  const badgeRarities = { Common: 'C', Rare: 'R', Epic: 'E', Legendary: 'L' };

  return (
    <div className="gamification-container">
      <div className="gamification-header">
        <h1>Achievement Hub</h1>
        <p>Track progress, badges, and leaderboard ranking.</p>
      </div>
      {error && <div className="loading">{error}</div>}

      <div className="user-stats-card">
        <div className="stat-item">
          <div className="stat-content">
            <h3>Level {userStats.level}</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, (userStats.xp % 1000) / 10)}%` }} />
            </div>
            <p>{userStats.xp % 1000} / 1000 XP</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-content">
            <h3>Total Points</h3>
            <p className="stat-value">{userStats.allTimePoints}</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-content">
            <h3>Current Streak</h3>
            <p className="stat-value">{userStats.dailyStreak} days</p>
          </div>
        </div>
      </div>

      <div className="gamification-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>Badges</button>
        <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
      </div>

      <div className="gamification-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="overview-card"><h3>Sessions</h3><p className="big-number">{userStats.interviewsCompleted}</p></div>
            <div className="overview-card"><h3>Avg Score</h3><p className="big-number">{Math.round(userStats.averageScore)}</p></div>
            <div className="overview-card"><h3>Global Rank</h3><p className="big-number">#{userStats.globalRank || '-'}</p></div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="badges-grid">
            {badges.map((badge) => (
              <div key={badge._id} className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
                <div className="badge-icon">{badgeRarities[badge.rarity] || 'B'}</div>
                <div className="badge-info">
                  <p>{badge.name}</p>
                  <p className="description">{badge.description}</p>
                  <p>{badge.earned ? `Earned: ${badge.earnedDate || '-'}` : `Progress: ${badge.requirement}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <div className="rank-col">Rank</div>
              <div className="name-col">User</div>
              <div className="level-col">Level</div>
              <div className="points-col">Points</div>
            </div>
            {leaderboard.map((entry, index) => (
              <div key={entry._id} className="leaderboard-row">
                <div className="rank-col">#{index + 1}</div>
                <div className="name-col">{entry.username}</div>
                <div className="level-col">{entry.level}</div>
                <div className="points-col">{entry.allTimePoints}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
