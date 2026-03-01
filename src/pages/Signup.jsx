import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import GoogleSignIn from '../services/GoogleSignIn';
import '../styles/Signup.css';

export default function Signup() {
  const navigate = useNavigate();
  const authBase = import.meta.env.VITE_API_URL || '';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    targetRole: 'Frontend Developer'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const targetRoles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Android Developer',
    'iOS Developer'
  ];

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\\d/.test(password)) strength += 20;
    if (/[@$!%*?&]/.test(password)) strength += 20;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain lowercase letters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase letters';
    } else if (!/\\d/.test(formData.password)) {
      newErrors.password = 'Password must contain numbers';
    } else if (!/[@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain special characters (@$!%*?&)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        targetRole: formData.targetRole
      });

      if (response && response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isAuthenticated', 'true');
        window.location.replace('/dashboard');
      } else {
        const errorMessage = response?.message || 'Signup failed. Please try again.';
        setErrors({ submit: errorMessage });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        err.message ||
        'Signup failed. Please try again.';
      setErrors({ submit: errorMessage });
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#f04438';
    if (passwordStrength < 70) return '#f59e0b';
    return '#16a34a';
  };

  return (
    <div className="signup-container">
      <div className="auth-grid">
        <section className="auth-panel">
          <div className="auth-brand">
            <div className="brand-mark">IP</div>
            <div>
              <h1>InterviewPrep</h1>
              <p>Industry-grade authentication. Career-grade prep.</p>
            </div>
          </div>

          <div className="auth-badges">
            <div className="badge chip">Multi-provider</div>
            <div className="badge chip">Rate limited</div>
            <div className="badge chip success">JWT + Refresh</div>
          </div>

          <div className="auth-metrics">
            <div>
              <span className="metric-value">12 min</span>
              <p>Avg time to first mock after signup</p>
            </div>
            <div>
              <span className="metric-value">4.8★</span>
              <p>User satisfaction</p>
            </div>
            <div>
              <span className="metric-value">N+1</span>
              <p>Security checks per request</p>
            </div>
          </div>

          <div className="auth-perks">
            <div className="perk-row">
              <span className="perk-icon">•</span>
              <div>
                <h3>Company tracks</h3>
                <p>Meta, Google, Amazon, and 50+ more mapped to you.</p>
              </div>
            </div>
            <div className="perk-row">
              <span className="perk-icon">•</span>
              <div>
                <h3>Skill graph</h3>
                <p>See your DSA, system design, and comms readiness in one graph.</p>
              </div>
            </div>
            <div className="perk-row">
              <span className="perk-icon">•</span>
              <div>
                <h3>Cloud backups</h3>
                <p>All attempts stored securely, exportable anytime.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="signup-card">
          <div className="card-head">
            <h2>Create account</h2>
            <p className="signup-subtitle">Sign up with full-stack auth ready for production.</p>
          </div>

          {errors.submit && <div className="form-error">{errors.submit}</div>}

          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                autoComplete="name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Target Role</label>
              <select
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
              >
                {targetRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  autoComplete="new-password"
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
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${passwordStrength}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                  <span className="strength-text">
                    {passwordStrength < 40 ? 'Weak' : passwordStrength < 70 ? 'Medium' : 'Strong'} password
                  </span>
                  <ul className="password-requirements">
                    <li style={{ color: formData.password.length >= 8 ? '#16a34a' : '#9ca3af' }}>
                      ✓ At least 8 characters
                    </li>
                    <li style={{ color: /[A-Z]/.test(formData.password) ? '#16a34a' : '#9ca3af' }}>
                      ✓ Uppercase letter
                    </li>
                    <li style={{ color: /[a-z]/.test(formData.password) ? '#16a34a' : '#9ca3af' }}>
                      ✓ Lowercase letter
                    </li>
                    <li style={{ color: /\\d/.test(formData.password) ? '#16a34a' : '#9ca3af' }}>
                      ✓ Number
                    </li>
                    <li style={{ color: /[@$!%*?&]/.test(formData.password) ? '#16a34a' : '#9ca3af' }}>
                      ✓ Special character (@$!%*?&)
                    </li>
                  </ul>
                </div>
              )}
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
              className="signup-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>

            <div className="divider">or</div>

            <GoogleSignIn
              isSignup
              onSuccess={() => window.location.replace('/dashboard')}
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

          <p className="login-link">
            Already have an account? <a href="#" onClick={() => navigate('/')}>Sign in</a>
          </p>
        </section>
      </div>
    </div>
  );
}
