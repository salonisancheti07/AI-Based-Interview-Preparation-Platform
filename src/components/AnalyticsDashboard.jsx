import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import '../styles/AnalyticsDashboard.css';

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const formatHours = (minutes = 0) => {
  const mins = Number(minutes || 0);
  if (mins < 60) return `${Math.round(mins)} min`;
  return `${(mins / 60).toFixed(1)} hrs`;
};

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fallbackRadar = [
    { topic: 'Arrays', score: 72 },
    { topic: 'DP', score: 55 },
    { topic: 'Graphs', score: 48 },
    { topic: 'System Design', score: 40 },
    { topic: 'SQL', score: 68 },
    { topic: 'Aptitude', score: 62 }
  ];

  const fallbackErrors = [
    { type: 'WA', cause: 'Off-by-one / edges', count: 12 },
    { type: 'TLE', cause: 'Inefficient approach', count: 6 },
    { type: 'RE', cause: 'Null/undefined', count: 3 }
  ];

  const fallbackDaily = [
    { label: 'Warm-up', title: 'Two Sum', pattern: 'Two Pointers' },
    { label: 'Main', title: 'Longest Repeating Char Replacement', pattern: 'Sliding Window' },
    { label: 'Speed', title: 'Minimum Window Substring', pattern: 'Sliding Window' }
  ];

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/ai/insights');
        setInsights(response?.data || null);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const weekSummary = useMemo(() => {
    if (!insights?.weeklyProgress?.length) {
      return { submissions: 0, solved: 0, avgScore: 0 };
    }
    const submissions = insights.weeklyProgress.reduce((sum, day) => sum + (day.submitted || 0), 0);
    const solved = insights.weeklyProgress.reduce((sum, day) => sum + (day.solved || 0), 0);
    const avgScore = submissions > 0 ? Math.round((solved / submissions) * 100) : 0;
    return { submissions, solved, avgScore };
  }, [insights]);

  const skillRadar = useMemo(() => {
    if (insights?.categoryPerformance?.length) {
      return insights.categoryPerformance.map((c) => ({
        topic: c.category,
        score: clampPercent(c.averageScore || 0)
      }));
    }
    return fallbackRadar;
  }, [insights]);

  const errorBreakdown = useMemo(() => {
    if (insights?.errorBreakdown?.length) return insights.errorBreakdown;
    return fallbackErrors;
  }, [insights]);

  const dailyTrio = useMemo(() => {
    if (insights?.dailyTrio?.length) return insights.dailyTrio;
    return fallbackDaily;
  }, [insights]);

  if (loading) {
    return <div className="analytics-container"><p>Loading analytics...</p></div>;
  }

  if (error) {
    return <div className="analytics-container"><p>{error}</p></div>;
  }

  if (!insights) {
    return <div className="analytics-container"><p>No analytics data available.</p></div>;
  }

  return (
    <div className="analytics-container">
      <h1>Your Performance Analytics</h1>

      <div className="analytics-grid">
        <div className="metric-card large">
          <h3>Overall Readiness</h3>
          <div className="readiness-circle">
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" className="circle-background" />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="circle-progress"
                style={{ strokeDasharray: `${clampPercent(insights.overallReadiness) * 2.827} 282.7` }}
              />
            </svg>
            <div className="circle-text">
              <div className="percentage">{clampPercent(insights.overallReadiness)}%</div>
              <div className="label">{insights.rank || 'Beginner'}</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Confidence</h3>
          <div className="score-display">
            <div className="score-number">{clampPercent(insights.confidence)}</div>
            <div className="score-bar">
              <div className="bar-fill" style={{ width: `${clampPercent(insights.confidence)}%` }} />
            </div>
            <p className="score-label">/100</p>
          </div>
        </div>

        <div className="metric-card">
          <h3>Problems Solved</h3>
          <div className="stat-number">{insights.solvedProblems || 0}</div>
          <p>Attempted: {insights.attemptedProblems || 0}</p>
        </div>

        <div className="metric-card">
          <h3>Accuracy</h3>
          <div className="stat-number">{clampPercent(insights.accuracy)}%</div>
          <p>Accepted: {insights.acceptedSubmissions || 0}</p>
        </div>
      </div>

      <div className="daily-trio">
        <div className="daily-head">
          <div>
            <p className="kicker">Daily Trio</p>
            <h2>Warm-up · Main · Speed-run</h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/interview')}>Start practice</button>
        </div>
        <div className="daily-grid">
          {dailyTrio.map((item, idx) => (
            <div key={idx} className="daily-card">
              <span className="pill">{item.label}</span>
              <h4>{item.title}</h4>
              <p>{item.pattern}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="radar-section">
        <div className="radar-head">
          <h2>Skill Radar</h2>
          <p>Strengths and gaps by topic</p>
        </div>
        <div className="radar-grid">
          {skillRadar.map((item) => (
            <div key={item.topic} className="radar-card">
              <div className="radar-ring">
                <svg viewBox="0 0 120 120">
                  <circle className="ring-bg" cx="60" cy="60" r="52" />
                  <circle
                    className="ring-fg"
                    cx="60"
                    cy="60"
                    r="52"
                    style={{ strokeDasharray: `${item.score * 3.27} 327` }}
                  />
                </svg>
                <div className="ring-text">
                  <span className="ring-score">{item.score}%</span>
                  <span className="ring-label">{item.topic}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="errors-section">
        <div className="radar-head">
          <h2>Error Taxonomy</h2>
          <p>Top failure causes to fix quickly</p>
        </div>
        <div className="error-table-wrap">
          <table className="error-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Likely Cause</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {errorBreakdown.map((row, idx) => (
                <tr key={`${row.type}-${idx}`}>
                  <td>{row.type}</td>
                  <td>{row.cause}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="category-section">
        <h2>Category Performance</h2>
        <div className="categories-grid">
          {(insights.categoryPerformance || []).map((cat) => (
            <div key={cat.category} className="category-card">
              <h4>{cat.category}</h4>
              <div className="category-stats">
                <div className="stat">
                  <label>Avg Score</label>
                  <div className="stat-value">{clampPercent(cat.averageScore)}%</div>
                </div>
                <div className="stat">
                  <label>Attempted</label>
                  <div className="stat-value">{cat.questionsAttempted || 0}</div>
                </div>
                <div className="stat">
                  <label>Trend</label>
                  <div className="stat-value">{cat.improvementRate > 0 ? `+${cat.improvementRate}` : cat.improvementRate}%</div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${clampPercent(cat.averageScore)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="topics-section">
        <h2>Topics to Focus</h2>
        <div className="topics-list">
          {(insights.weakTopics || []).length ? insights.weakTopics.map((topic) => (
            <div key={topic.topic} className="topic-item">
              <div className="topic-info">
                <h4>{topic.topic}</h4>
                <div className="topic-meta">
                  <span className={`priority ${(topic.priority || 'Medium').toLowerCase()}`}>{topic.priority} Priority</span>
                  <span className="attempts">{topic.questionsAttempted || 0} attempts</span>
                </div>
              </div>
              <div className="topic-score">
                <div className="score-badge">{clampPercent(topic.averageScore)}%</div>
                <div className="action-btn">
                  <button onClick={() => navigate('/interview', { state: { category: 'all', searchTerm: topic.topic } })}>
                    Practice
                  </button>
                </div>
              </div>
            </div>
          )) : <p className="no-data">No weak topics identified yet.</p>}
        </div>
      </div>

      <div className="topics-section">
        <h2>Your Strengths</h2>
        <div className="topics-list">
          {(insights.strongTopics || []).length ? insights.strongTopics.map((topic) => (
            <div key={topic.topic} className="topic-item strong">
              <div className="topic-info">
                <h4>{topic.topic}</h4>
                <span className="mastered">Mastered</span>
              </div>
              <div className="topic-score">
                <div className="score-badge strong">{clampPercent(topic.averageScore)}%</div>
              </div>
            </div>
          )) : <p className="no-data">Keep solving to build strengths.</p>}
        </div>
      </div>

      <div className="time-analytics">
        <h2>Weekly Momentum</h2>
        <div className="weekly-bars">
          {(insights.weeklyProgress || []).map((day) => (
            <div key={day.day} className="week-col">
              <div className="week-bar-track">
                <div className="week-bar-fill" style={{ height: `${clampPercent(day.score)}%` }} />
              </div>
              <div className="week-day">{day.day}</div>
              <div className="week-score">{clampPercent(day.score)}%</div>
            </div>
          ))}
        </div>
        <div className="time-grid">
          <div className="time-card">
            <h4>This Week</h4>
            <div className="time-stat">
              <div className="hours">{weekSummary.submissions}</div>
              <div className="change">Submissions</div>
            </div>
          </div>
          <div className="time-card">
            <h4>Solved This Week</h4>
            <div className="time-stat">
              <div className="streak">{weekSummary.solved}</div>
              <div className="message">Accepted runs</div>
            </div>
          </div>
          <div className="time-card">
            <h4>Current Streak</h4>
            <div className="time-stat">
              <div className="milestone">{insights.currentStreak || 0} days</div>
              <div className="eta">Longest: {insights.longestStreak || 0}</div>
            </div>
          </div>
          <div className="time-card">
            <h4>Total Time</h4>
            <div className="time-stat">
              <div className="estimate">{formatHours(insights.totalTimeSpent)}</div>
              <div className="role">Avg Score: {weekSummary.avgScore}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="recommendations-section">
        <h2>AI Recommendations</h2>
        <div className="recommendations-list">
          {(insights.aiRecommendations || []).map((rec, index) => (
            <div key={`${index}-${rec}`} className="recommendation-item">
              <p className="recommendation-text">{index + 1}. {rec}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-primary" onClick={() => navigate('/question-recommender')}>View Learning Path</button>
        <button className="btn-secondary" onClick={() => navigate('/mock-interview')}>Take Mock Interview</button>
        <button className="btn-secondary" onClick={() => navigate('/ai-tutor')}>Chat with AI Tutor</button>
      </div>
    </div>
  );
}
