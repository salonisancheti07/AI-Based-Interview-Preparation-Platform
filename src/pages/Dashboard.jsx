import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuestions, getQuestionsByCategory } from '../data/questions';
import { getDailyStreakStats } from '../services/streakService';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const user = JSON.parse(localStorage.getItem('user') || '{"name":"User"}');
  const solved = user?.statistics?.solvedProblems || 0;
  const attempted = user?.statistics?.attemptedProblems || 0;
  const accuracy = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;
  const timeSpent = user?.statistics?.totalMinutesPracticed || 0; // default minutes
  const streakStats = getDailyStreakStats();
  const aptitudeQuestions = getQuestionsByCategory('aptitude');
  const dsaQuestions = getQuestionsByCategory('dsa');

  const aptitudeSectionCounts = useMemo(() => {
    const counts = {};
    aptitudeQuestions.forEach((question) => {
      const section = question.subCategory || 'General Aptitude';
      counts[section] = (counts[section] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [aptitudeQuestions]);

  const dsaSectionCounts = useMemo(() => {
    const counts = {};
    dsaQuestions.forEach((question) => {
      const section = question.subCategory || 'General DSA';
      counts[section] = (counts[section] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dsaQuestions]);

  const categories = [
    { id: 'all', name: 'All Questions', icon: 'Q', count: getAllQuestions().length },
    { id: 'html', name: 'HTML & CSS', icon: 'H', count: getQuestionsByCategory('html').length },
    { id: 'javascript', name: 'JavaScript', icon: 'JS', count: getQuestionsByCategory('javascript').length },
    { id: 'react', name: 'React', icon: 'R', count: getQuestionsByCategory('react').length },
    { id: 'node', name: 'Node.js', icon: 'N', count: getQuestionsByCategory('node').length },
    { id: 'database', name: 'Database', icon: 'DB', count: getQuestionsByCategory('database').length },
    { id: 'aptitude', name: 'Aptitude', icon: 'A', count: aptitudeQuestions.length },
    { id: 'system-design', name: 'System Design', icon: 'SD', count: getQuestionsByCategory('system-design').length },
    { id: 'dsa', name: 'DSA', icon: 'DSA', count: dsaQuestions.length }
  ];

  const featuredQuestions = selectedCategory === 'all'
    ? getAllQuestions().slice(0, 4)
    : selectedCategory === 'dsa'
      ? getQuestionsByCategory(selectedCategory).slice(0, 24)
      : selectedCategory === 'aptitude'
        ? getQuestionsByCategory(selectedCategory).slice(0, 20)
        : getQuestionsByCategory(selectedCategory).slice(0, 4);

  const stats = [
    { label: 'Questions Solved', value: solved, icon: 'OK' },
    { label: 'Streak Days', value: streakStats.currentStreak, icon: 'ST' },
    { label: 'Accuracy Rate', value: `${accuracy}%`, icon: 'AR' },
    { label: 'Time Spent', value: timeSpent ? `${Math.round(timeSpent)} min` : '0 min', icon: 'TS' }
  ];

  const technicalHighlights = [
    'Real-time interview difficulty adaptation (adaptive AI engine)',
    'RAG for contextual question generation',
    'Speech-to-text voice interviews with sentiment and confidence scoring',
    'AI-based skill gap analysis with weak/avg/strong breakdown + plan',
    'Peer mock interview mode with pairing, ratings, feedback (WebSockets)',
    'Recruiter analytics: failed topics, common mistakes, trends',
    'AI knowledge graph suggestions (prereqs, follow-ups)',
    'AI explanation generator (simple/medium/advanced, real examples)',
    'OAuth + JWT with role-based access (User/Admin/Recruiter)',
    'Project-based interview simulations (e.g., Instagram backend, chat, fraud ML)',
    'AI interview prediction score: technical, communication, confidence, hire probability'
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate('/interview', { state: { category: categoryId } });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Modern Header */}
      <div className="dashboard-header glass">
        <div className="container-responsive">
          <div className="header-content">
            <div className="header-text">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user.name}</span>! 👋
              </h1>
              <p className="welcome-subtitle">Ready to ace your next interview?</p>
              <div className="header-badges">
                <span className="badge badge-premium">Premium Member</span>
                <span className="badge badge-streak">🔥 {streakStats.currentStreak} Day Streak</span>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-secondary">
                <span className="btn-icon">🎯</span>
                Quick Practice
              </button>
              <button
                className="btn-ghost logout-btn"
                onClick={() => {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  localStorage.removeItem('isAuthenticated');
                  navigate('/');
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="container-responsive">
          <div className="section-title">
            <h2>Your Progress</h2>
            <p>Track your interview preparation journey</p>
          </div>

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card glass-card">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">{stat.icon}</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-trend">
                    <span className="trend-up">↗ +12%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Highlights */}
      <section className="highlights-section">
        <div className="container-responsive">
          <div className="section-title">
            <h2>🚀 Advanced Features</h2>
            <p>Professional-grade interview preparation tools</p>
          </div>

          <div className="highlights-grid">
            {technicalHighlights.map((highlight, index) => (
              <div key={index} className="highlight-card glass-card">
                <div className="highlight-icon">✨</div>
                <p>{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container-responsive">
          <div className="section-title">
            <h2>Choose Your Focus</h2>
            <p>Select a category to start practicing</p>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-card glass-card ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className="category-icon">{category.icon}</div>
                <div className="category-info">
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">{category.count} questions</div>
                </div>
                <div className="category-arrow">→</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Questions Preview */}
      <section className="questions-section">
        <div className="container-responsive">
          <div className="section-header">
            <div>
              <h2>Featured Questions</h2>
              <p>Hand-picked questions to boost your skills</p>
            </div>
            <button
              className="btn-secondary view-all-btn"
              onClick={() => navigate('/interview', { state: { category: selectedCategory } })}
            >
              View All Questions →
            </button>
          </div>

          {selectedCategory === 'aptitude' && (
            <div className="aptitude-sections-summary">
              {aptitudeSectionCounts.map(([name, count]) => (
                <span key={name} className="aptitude-section-chip">{name}: {count}</span>
              ))}
            </div>
          )}

          {selectedCategory === 'dsa' && (
            <div className="aptitude-sections-summary">
              {dsaSectionCounts.map(([name, count]) => (
                <span key={name} className="aptitude-section-chip">{name}: {count}</span>
              ))}
            </div>
          )}

          <div className="questions-list">
            {featuredQuestions.map((question) => (
              <div key={question.id} className="question-card">
                <div className="question-header">
                  <h3>{question.title}</h3>
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: `${getDifficultyColor(question.difficulty)}20`, color: getDifficultyColor(question.difficulty) }}
                  >
                    {question.difficulty}
                  </span>
                </div>

                <div className="question-meta">
                  <span className="category-tag">{question.subCategory || question.category}</span>
                  <span className="attempts">{question.attempts} attempts</span>
                  <span className="success-rate">{question.successRate}% success</span>
                </div>

                <div className="question-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate('/interview', { state: { category: selectedCategory } })}
                  >
                    Preview
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => navigate('/interview', { state: { category: selectedCategory } })}
                  >
                    Start Practice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cta-section">
          <div className="cta-content">
            <h3>All Features Available</h3>
            <p>Use AI-powered feedback, mock interviews, and personalized learning paths for free.</p>
            <button className="btn-upgrade" onClick={() => navigate('/roadmaps')}>
              Explore Features
            </button>
          </div>
        </div>

        <div className="tech-highlights">
          <h3>Technical Highlights</h3>
          <ul>
            {technicalHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
