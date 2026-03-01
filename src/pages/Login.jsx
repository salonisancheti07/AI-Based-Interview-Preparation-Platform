import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import GoogleSignIn from '../services/GoogleSignIn';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const authBase = import.meta.env.VITE_API_URL || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response && response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isAuthenticated', 'true');
        // hard redirect to ensure protected routes re-evaluate auth
        window.location.replace('/dashboard');
      } else {
        const errorMessage = response?.message || 'Login failed. Please try again.';
        setErrors({ submit: errorMessage });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.';
      setErrors({ submit: errorMessage });
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="login-container">
      <div className="auth-grid">
        <section className="auth-panel">
          <div className="auth-brand">
            <div className="brand-mark">IP</div>
            <div>
              <h1>InterviewPrep</h1>
              <p>Train like a real interview. Ship results.</p>
            </div>
          </div>

          <div className="auth-badges">
            <div className="badge chip">Secure OAuth</div>
            <div className="badge chip">Email + Password</div>
            <div className="badge chip success">Refresh tokens</div>
          </div>

          <div className="auth-metrics">
            <div>
              <span className="metric-value">98.4%</span>
              <p>Login success rate (30d)</p>
            </div>
            <div>
              <span className="metric-value">25K</span>
              <p>Sessions protected</p>
            </div>
            <div>
              <span className="metric-value">0</span>
              <p>Credential leaks</p>
            </div>
          </div>

          <div className="auth-perks">
            <div className="perk-row">
              <span className="perk-icon">•</span>
              <div>
                <h3>Session resume</h3>
                <p>Pick up coding and MCQ drills right where you left off.</p>
              </div>
            </div>
            <div className="perk-row">
              <span className="perk-icon">•</span>
              <div>
                <h3>Adaptive prep</h3>
                <p>Difficulty auto-tunes after every submission.</p>
              </div>
            </div>
            <div className="perk-row">
              <span className="perk-icon">•</span>
              <div>
                <h3>ATS ready</h3>
                <p>Export reports recruiters love in one click.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="card-head">
            <h2>Sign in</h2>
            <p className="login-subtitle">Full authentication with session + OAuth.</p>
          </div>

          {errors.submit && <div className="form-error">{errors.submit}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                name="email"
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  name="password"
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-footer">
              <label className="remember-me">
                <input type="checkbox" />
                Keep me signed in (secure)
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Continue'}
            </button>

            <div className="divider">or</div>

            <GoogleSignIn
              onSuccess={() => navigate('/dashboard')}
            />

            <button
              type="button"
              className="social-btn github"
              onClick={() => {
                const url = `${authBase}/api/auth/github/start`;
                window.location.href = url;
              }}
            >
              <span className="social-dot" /> Continue with GitHub
            </button>
          </form>

          <p className="signup-link">
            New here? <a href="#" onClick={() => navigate('/signup')}>Create account</a>
          </p>
        </section>
      </div>
    </div>
  );
}
