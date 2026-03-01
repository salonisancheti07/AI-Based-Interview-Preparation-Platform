import { useNavigate, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/Navbar.css';

// AI/ML Utility Functions
const ML_FEATURE_RECOMMENDER = {
  // Track user interactions for ML-based recommendations
  trackFeatureClick: (featurePath) => {
    const clicks = JSON.parse(localStorage.getItem('featureClicks') || '{}');
    clicks[featurePath] = (clicks[featurePath] || 0) + 1;
    localStorage.setItem('featureClicks', JSON.stringify(clicks));
  },

  // Get most used features
  getMostUsedFeatures: (features) => {
    const clicks = JSON.parse(localStorage.getItem('featureClicks') || '{}');
    return features.sort((a, b) => (clicks[b.path] || 0) - (clicks[a.path] || 0));
  },

  // AI scoring: recommend features based on usage patterns
  scoreFeature: (feature, clicks) => {
    const baseScore = clicks[feature.path] || 0;
    const recencyBoost = feature.recent ? 20 : 0;
    const categoryBoost = feature.category === 'core' ? 10 : 0;
    return baseScore + recencyBoost + categoryBoost;
  },

  // Get personalized recommendations
  getRecommendations: (features, limit = 5) => {
    const clicks = JSON.parse(localStorage.getItem('featureClicks') || '{}');
    const scored = features.map(f => ({
      ...f,
      score: ML_FEATURE_RECOMMENDER.scoreFeature(f, clicks)
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  },

  // Smart filtering based on search
  searchFeatures: (features, query) => {
    if (!query.trim()) return features;
    const q = query.toLowerCase();
    return features.filter(f => 
      f.label.toLowerCase().includes(q) || 
      (f.keywords && f.keywords.some(k => k.includes(q)))
    );
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [featureSearchTerm, setFeatureSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user?.name || user?.fullName || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    // Notify app to recalc auth state
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/login');
  };

  const handleSearch = () => {
    const query = searchTerm.trim();
    if (!query) return;
    navigate('/interview', { state: { category: 'all', searchTerm: query } });
    setSearchTerm('');
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const mainLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/interview', label: 'Practice', icon: '🧩', state: { category: 'dsa' } },
    { path: '/contests', label: 'Contests', icon: '🏁' },
    { path: '/aptitude', label: 'Aptitude', icon: '🧮' }
  ];

  const featureLinks = [
    // Core add-ons
    { path: '/roadmaps', label: 'Roadmaps', icon: '🧭', category: 'core', keywords: ['learning', 'path'] },
    { path: '/mock-rounds', label: 'Mock Rounds', icon: '🎤', category: 'core', keywords: ['practice', 'interview'] },
    { path: '/contests', label: 'Contests', icon: '🏁', category: 'core', keywords: ['compete', 'challenge'] },
    { path: '/aptitude', label: 'Aptitude', icon: '🧮', category: 'core', keywords: ['test', 'quantitative'] },
    { path: '/flashcards', label: 'Flashcards', icon: '🗂️', category: 'core', keywords: ['learn', 'memorize'] },
    { path: '/community', label: 'Community', icon: '🤝', category: 'core', keywords: ['discuss', 'share'] },
    // AI Tools - Intelligent Features
    { path: '/ai-assist', label: 'AI Assist', icon: '🤖', category: 'ai', keywords: ['help', 'suggestion', 'ai'] },
    { path: '/ai-tutor', label: 'AI Chat Tutor', icon: '💬', category: 'ai', keywords: ['chat', 'tutor', 'ai'] },
    { path: '/question-recommender', label: 'Smart Recommender', icon: '🧠', category: 'ai', keywords: ['suggest', 'recommend', 'ml'] },
    { path: '/analytics', label: 'Analytics', icon: '📈', category: 'ai', keywords: ['stats', 'analysis', 'insight'] },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆', category: 'core', keywords: ['rank', 'score', 'compete'] },
    // Enhanced Features
    { path: '/resume-builder', label: 'Resume Builder', icon: '📄', category: 'premium', keywords: ['resume', 'cv', 'job'] },
    { path: '/gamification', label: 'Gamification', icon: '🎯', category: 'premium', keywords: ['game', 'badge', 'reward'] },
    { path: '/company-prep', label: 'Company Prep', icon: '🏢', category: 'premium', keywords: ['company', 'faang', 'prepare'] },
    { path: '/quick-practice', label: 'Quick Practice', icon: '⚡', category: 'premium', keywords: ['fast', 'quick', 'short'] },
    { path: '/video-recording', label: 'Video Recording', icon: '📹', category: 'premium', keywords: ['video', 'record', 'speak'] },
    { path: '/interview-notes', label: 'Interview Notes', icon: '📝', category: 'premium', keywords: ['notes', 'record', 'save'] },
    { path: '/peer-practice', label: 'Peer Practice', icon: '👥', category: 'premium', keywords: ['practice', 'peer', 'together'] },
    { path: '/interview-report', label: 'Interview Report', icon: '📊', category: 'premium', keywords: ['report', 'analysis', 'feedback'] },
    { path: '/progress-export', label: 'Progress Export', icon: '⬇️', category: 'premium', keywords: ['export', 'download', 'save'] },
    // Interview Specializations
    { path: '/mock-interview', label: 'Mock Interview', icon: '🎙️', category: 'special', keywords: ['mock', 'interview', 'simulate'] },
    { path: '/behavioral', label: 'Behavioral', icon: '💼', category: 'special', keywords: ['soft', 'skills', 'behavior'] },
    { path: '/system-design', label: 'System Design', icon: '🧱', category: 'special', keywords: ['design', 'architecture', 'system'] },
  ];

  return (
    <nav className="navbar glass">
      <div className="navbar-content">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-logo" onClick={() => navigate('/dashboard')}>
            <span className="logo-icon">🚀</span>
            <span className="logo-text">InterviewPrep</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          <div className="nav-group">
            {mainLinks.slice(0, 4).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                state={item.state}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Features Dropdown */}
          <div className="nav-dropdown">
            <button
              className="nav-link dropdown-trigger"
              onClick={() => setShowFeaturesMenu(!showFeaturesMenu)}
            >
              <span className="nav-icon">⚡</span>
              <span className="nav-label">Features</span>
              <span className="dropdown-arrow">{showFeaturesMenu ? '▲' : '▼'}</span>
            </button>

            {showFeaturesMenu && (
              <div className="dropdown-menu glass-card">
                <div className="dropdown-section">
                  <h4>Core Features</h4>
                  <div className="dropdown-grid">
                    {featureLinks.slice(0, 6).map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        onClick={() => setShowFeaturesMenu(false)}
                      >
                        <span className="item-icon">{item.icon}</span>
                        <span className="item-label">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="dropdown-section">
                  <h4>AI Tools</h4>
                  <div className="dropdown-grid">
                    {featureLinks.slice(6, 12).map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        onClick={() => setShowFeaturesMenu(false)}
                      >
                        <span className="item-icon">{item.icon}</span>
                        <span className="item-label">{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* More Dropdown - AI Enhanced */}
          <div className="nav-dropdown">
            <button
              className="nav-link dropdown-trigger"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <span className="nav-icon">⋯</span>
              <span className="nav-label">More</span>
              <span className="dropdown-arrow">{showMoreMenu ? '▲' : '▼'}</span>
            </button>

            {showMoreMenu && (
              <div className="dropdown-menu glass-card more-dropdown-enhanced">
                {/* AI-Powered Search */}
                <div className="dropdown-search">
                  <input
                    type="text"
                    placeholder="🔍 Search features (AI-powered)..."
                    value={featureSearchTerm}
                    onChange={(e) => setFeatureSearchTerm(e.target.value)}
                    className="feature-search-input"
                  />
                </div>

                {/* Personalized Recommendations */}
                {!featureSearchTerm && ML_FEATURE_RECOMMENDER.getRecommendations(featureLinks, 4).some(f => f.score > 0) && (
                  <div className="dropdown-section recommendations-section">
                    <h4>⭐ Recommended For You</h4>
                    <div className="dropdown-grid">
                      {ML_FEATURE_RECOMMENDER.getRecommendations(featureLinks, 4).map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `dropdown-item recommended-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            ML_FEATURE_RECOMMENDER.trackFeatureClick(item.path);
                            setShowMoreMenu(false);
                          }}
                          title={`Usage: ${JSON.parse(localStorage.getItem('featureClicks') || '{}')[item.path] || 0} clicks`}
                        >
                          <span className="item-icon">{item.icon}</span>
                          <span className="item-label">{item.label}</span>
                          <span className="ai-badge">AI</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}

                {/* Premium Features Section */}
                {!featureSearchTerm && (
                  <div className="dropdown-section">
                    <h4>✨ Premium Features</h4>
                    <div className="dropdown-grid">
                      {featureLinks.filter(f => f.category === 'premium').slice(0, 4).map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            ML_FEATURE_RECOMMENDER.trackFeatureClick(item.path);
                            setShowMoreMenu(false);
                          }}
                        >
                          <span className="item-icon">{item.icon}</span>
                          <span className="item-label">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Specializations */}
                {!featureSearchTerm && (
                  <div className="dropdown-section">
                    <h4>🎯 Interview Specializations</h4>
                    <div className="dropdown-grid">
                      {featureLinks.filter(f => f.category === 'special').map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            ML_FEATURE_RECOMMENDER.trackFeatureClick(item.path);
                            setShowMoreMenu(false);
                          }}
                        >
                          <span className="item-icon">{item.icon}</span>
                          <span className="item-label">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {featureSearchTerm && (
                  <div className="dropdown-section search-results">
                    <h4>Search Results ({ML_FEATURE_RECOMMENDER.searchFeatures(featureLinks, featureSearchTerm).length})</h4>
                    <div className="dropdown-grid">
                      {ML_FEATURE_RECOMMENDER.searchFeatures(featureLinks, featureSearchTerm).map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            ML_FEATURE_RECOMMENDER.trackFeatureClick(item.path);
                            setShowMoreMenu(false);
                            setFeatureSearchTerm('');
                          }}
                        >
                          <span className="item-icon">{item.icon}</span>
                          <span className="item-label">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Features as fallback */}
                {!featureSearchTerm && (
                  <div className="dropdown-section all-features">
                    <h4>📚 All Features</h4>
                    <div className="dropdown-grid compact">
                      {featureLinks.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `dropdown-item compact-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            ML_FEATURE_RECOMMENDER.trackFeatureClick(item.path);
                            setShowMoreMenu(false);
                          }}
                          title={item.label}
                        >
                          <span className="item-icon">{item.icon}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">
              🔍
            </button>
          </div>
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          <button
            className="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <div className="user-menu">
            <button
              className="user-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {userInitial}
              </div>
              <span className="user-name">{userName}</span>
              <span className="dropdown-arrow">{showUserMenu ? '▲' : '▼'}</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown glass-card">
                <div className="user-info">
                  <div className="user-avatar-large">{userInitial}</div>
                  <div className="user-details">
                    <div className="user-full-name">{userName}</div>
                    <div className="user-role">Premium Member</div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <NavLink to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <span className="item-icon">👤</span>
                  <span>Profile</span>
                </NavLink>

                <NavLink to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <span className="item-icon">⚙️</span>
                  <span>Settings</span>
                </NavLink>

                <button
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                >
                  <span className="item-icon">🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Toggle mobile menu"
        >
          <span className="hamburger-icon">{showMobileMenu ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu glass-card">
          <div className="mobile-search">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">🔍</button>
          </div>

          <div className="mobile-nav-links">
            {mainLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                state={item.state}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}

            <div className="mobile-section">
              <h4>Features</h4>
              {featureLinks.slice(0, 8).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
