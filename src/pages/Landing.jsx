import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="landing">
      {/* Modern Navigation */}
      <header className="landing-nav glass">
        <div className="container-responsive">
          <div className="nav-content">
            <div className="landing-logo animate-fade-in">
              <div className="logo-icon">
                <span className="logo-mark">🚀</span>
              </div>
              <div className="logo-text">
                <span className="brand">Interview</span>
                <span className="accent">Prep</span>
              </div>
            </div>

            <nav className="landing-links hidden md:flex">
              <a href="#features" className="nav-link">Features</a>
              <a href="#pricing" className="nav-link">Pricing</a>
              <a href="#testimonials" className="nav-link">Success Stories</a>
              <a href="#contact" className="nav-link">Contact</a>
            </nav>

            <div className="landing-actions">
              <button
                className="btn-ghost hidden sm:block"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/signup")}
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container-responsive">
          <div className="hero-content">
            <div className={`hero-copy ${isVisible ? 'animate-fade-in' : ''}`}>
              <div className="hero-badge">
                <span className="badge-icon">⭐</span>
                <span>Trusted by 1.4M+ developers worldwide</span>
              </div>

              <h1 className="hero-title">
                Master Technical Interviews with
                <span className="gradient-text"> AI-Powered Learning</span>
              </h1>

              <p className="hero-description">
                Transform your career with personalized learning paths, real-time AI feedback,
                and industry-leading practice platforms. Join thousands of developers who landed
                their dream jobs through our comprehensive interview preparation system.
              </p>

              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-number">95%</div>
                  <div className="stat-label">Success Rate</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Companies</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Interviews</div>
                </div>
              </div>

              <div className="hero-cta">
                <button
                  className="btn-primary hero-cta-primary"
                  onClick={() => navigate("/signup")}
                >
                  Start Your Journey
                  <span className="arrow">→</span>
                </button>
                <button
                  className="btn-secondary hero-cta-secondary"
                  onClick={() => navigate("/login")}
                >
                  Watch Demo
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <span className="check-icon">✓</span>
                  <span>No credit card required</span>
                </div>
                <div className="trust-item">
                  <span className="check-icon">✓</span>
                  <span>7-day free trial</span>
                </div>
                <div className="trust-item">
                  <span className="check-icon">✓</span>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className={`hero-visual ${isVisible ? 'animate-slide-up' : ''}`}>
              <div className="dashboard-preview glass-card">
                <div className="preview-header">
                  <div className="preview-tabs">
                    <div className="tab active">Dashboard</div>
                    <div className="tab">Practice</div>
                    <div className="tab">Analytics</div>
                  </div>
                  <div className="preview-controls">
                    <span className="control-dot red"></span>
                    <span className="control-dot yellow"></span>
                    <span className="control-dot green"></span>
                  </div>
                </div>

                <div className="preview-content">
                  <div className="preview-stats">
                    <div className="stat-card">
                      <div className="stat-icon">📊</div>
                      <div className="stat-info">
                        <div className="stat-value">247</div>
                        <div className="stat-name">Problems Solved</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">🎯</div>
                      <div className="stat-info">
                        <div className="stat-value">89%</div>
                        <div className="stat-name">Accuracy</div>
                      </div>
                    </div>
                  </div>

                  <div className="preview-chart">
                    <div className="chart-bar" style={{height: '60%'}}></div>
                    <div className="chart-bar" style={{height: '80%'}}></div>
                    <div className="chart-bar" style={{height: '40%'}}></div>
                    <div className="chart-bar" style={{height: '90%'}}></div>
                    <div className="chart-bar" style={{height: '70%'}}></div>
                  </div>

                  <div className="preview-activity">
                    <div className="activity-item">
                      <div className="activity-icon">🧠</div>
                      <div className="activity-text">
                        <span className="activity-title">AI Analysis Complete</span>
                        <span className="activity-time">2 mins ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="floating-elements">
                <div className="floating-card card-1">
                  <div className="card-icon">🤖</div>
                  <div className="card-text">AI Feedback</div>
                </div>
                <div className="floating-card card-2">
                  <div className="card-icon">📈</div>
                  <div className="card-text">Progress Tracking</div>
                </div>
                <div className="floating-card card-3">
                  <div className="card-icon">👥</div>
                  <div className="card-text">Peer Practice</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="hero-bg-elements">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container-responsive">
          <div className="section-header">
            <h2 className="section-title">Why Choose InterviewPrep?</h2>
            <p className="section-description">
              Everything you need to excel in technical interviews, powered by cutting-edge AI
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon">🎯</div>
              <h3>Adaptive Learning</h3>
              <p>AI-powered difficulty adjustment based on your performance patterns</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">📊</div>
              <h3>Skill Gap Analysis</h3>
              <p>Identify weaknesses with detailed analytics and personalized recommendations</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">👥</div>
              <h3>Peer Mock Interviews</h3>
              <p>Practice with real candidates and get feedback from industry professionals</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Explanations</h3>
              <p>Get instant, multi-level explanations for complex concepts and problems</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">🏢</div>
              <h3>Company-Specific Prep</h3>
              <p>Tailored preparation for FAANG and other top tech companies</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon">📈</div>
              <h3>Progress Analytics</h3>
              <p>Comprehensive dashboards tracking your interview readiness</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container-responsive">
          <div className="cta-content glass-card">
            <h2>Ready to Land Your Dream Job?</h2>
            <p>Join millions of developers who transformed their careers with InterviewPrep</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/signup")}
            >
              Get Started Now - It's Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
