import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Leaderboard.css';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('week');
  const [selectedRole, setSelectedRole] = useState('all');

  const roles = ['all', 'Frontend Developer', 'Backend Developer', 'Full Stack', 'DevOps'];

  const leaderboardData = [
    { rank: 1, name: 'Alex Kumar', score: 2850, questions: 142, accuracy: 94, role: 'Frontend Developer', streak: 45 },
    { rank: 2, name: 'Sarah Chen', score: 2720, questions: 136, accuracy: 92, role: 'Backend Developer', streak: 38 },
    { rank: 3, name: 'John Smith', score: 2680, questions: 134, accuracy: 89, role: 'Full Stack', streak: 32 },
    { rank: 4, name: 'Priya Sharma', score: 2590, questions: 130, accuracy: 88, role: 'DevOps', streak: 28 },
    { rank: 5, name: 'Michael Lee', score: 2510, questions: 126, accuracy: 85, role: 'Frontend Developer', streak: 24 },
    { rank: 6, name: 'Emma Wilson', score: 2450, questions: 122, accuracy: 83, role: 'Backend Developer', streak: 20 },
    { rank: 7, name: 'David Brown', score: 2380, questions: 119, accuracy: 81, role: 'Full Stack', streak: 18 },
    { rank: 8, name: 'Lisa Anderson', score: 2290, questions: 115, accuracy: 79, role: 'Frontend Developer', streak: 15 },
  ];

  const currentUser = {
    rank: 142,
    name: 'You',
    score: 890,
    questions: 45,
    accuracy: 76,
    role: 'Frontend Developer',
    streak: 7
  };

  const filtered = leaderboardData.filter(user =>
    selectedRole === 'all' || user.role === selectedRole
  );

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
        <h1>🏆 Global Leaderboard</h1>
      </div>

      {/* Current User Card */}
      <div className="current-user-card">
        <div className="user-rank">
          <div className="rank-number">#{currentUser.rank}</div>
          <div className="rank-label">Your Rank</div>
        </div>
        <div className="user-details">
          <h3>{currentUser.name}</h3>
          <p className="role-badge">{currentUser.role}</p>
        </div>
        <div className="user-stats">
          <div className="user-stat">
            <div className="stat-value">{currentUser.score}</div>
            <div className="stat-label">Score</div>
          </div>
          <div className="user-stat">
            <div className="stat-value">{currentUser.accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="user-stat">
            <div className="stat-value">{currentUser.streak} 🔥</div>
            <div className="stat-label">Streak</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="leaderboard-filters">
        <div className="filter-group">
          <label>Time Period:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="day">This Week</option>
            <option value="week">This Month</option>
            <option value="month">All Time</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Role:</label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            {roles.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-table">
        <div className="table-header">
          <div className="col-rank">Rank</div>
          <div className="col-user">User</div>
          <div className="col-score">Score</div>
          <div className="col-questions">Questions</div>
          <div className="col-accuracy">Accuracy</div>
          <div className="col-streak">Streak</div>
        </div>

        {filtered.map((user) => (
          <div key={user.rank} className="table-row">
            <div className="col-rank">
              <span className="medal">{getMedalIcon(user.rank)}</span>
            </div>
            <div className="col-user">
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>
            <div className="col-score">
              <span className="score-value">{user.score}</span>
            </div>
            <div className="col-questions">
              <span>{user.questions}</span>
            </div>
            <div className="col-accuracy">
              <div className="accuracy-bar">
                <div 
                  className="accuracy-fill"
                  style={{ 
                    width: `${user.accuracy}%`,
                    backgroundColor: user.accuracy >= 90 ? '#10b981' : user.accuracy >= 80 ? '#f59e0b' : '#ef4444'
                  }}
                ></div>
              </div>
              <span className="accuracy-text">{user.accuracy}%</span>
            </div>
            <div className="col-streak">
              <span>🔥 {user.streak}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Message */}
      <div className="motivation-card">
        <h3>💪 Keep Pushing!</h3>
        <p>You're {currentUser.rank - 1} positions away from the top 100. Keep practicing and climb the leaderboard!</p>
        <button className="btn-primary" onClick={() => navigate('/interview')}>
          Start Next Quiz
        </button>
      </div>
    </div>
  );
}
