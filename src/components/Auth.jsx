import React, { useState } from 'react';
import axios from '../services/apiClient';
import '../styles/Auth.css';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[@$!%*?&]/.test(password)) strength += 20;
    setPasswordStrength(strength);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password' && !isLogin) {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!isLogin && !formData.name) {
      newErrors.push('Name is required');
    }
    
    if (!formData.email) {
      newErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push('Invalid email format');
    }
    
    if (!formData.password) {
      newErrors.push('Password is required');
    }
    
    if (!isLogin) {
      if (formData.password.length < 8) {
        newErrors.push('Password must be at least 8 characters');
      }
      if (!/[a-z]/.test(formData.password)) {
        newErrors.push('Password must contain lowercase letters');
      }
      if (!/[A-Z]/.test(formData.password)) {
        newErrors.push('Password must contain uppercase letters');
      }
      if (!/\d/.test(formData.password)) {
        newErrors.push('Password must contain numbers');
      }
      if (!/[@$!%*?&]/.test(formData.password)) {
        newErrors.push('Password must contain special characters (@$!%*?&)');
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.push('Passwords do not match');
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };
      
      const response = await axios.post(endpoint, payload);
      
      // Response is already unwrapped by apiClient interceptor
      if (response && response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onLoginSuccess(response.user);
      } else {
        setErrors([response?.message || 'An error occurred']);
      }
    } catch (err) {
      setErrors([err.response?.data?.message || err.message || 'An error occurred']);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#ff4444';
    if (passwordStrength < 70) return '#ffaa00';
    return '#44aa44';
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>InterviewPrep</h1>
          <p>{isLogin ? 'Welcome Back!' : 'Get Started'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.length > 0 && (
            <div className="auth-errors">
              {errors.map((error, idx) => (
                <div key={idx} className="error-message">❌ {error}</div>
              ))}
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isLogin ? '••••••••' : 'Min 8 chars, uppercase, number, symbol'}
              required
            />
            {!isLogin && formData.password && (
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
                  {passwordStrength < 40 ? 'Weak' : passwordStrength < 70 ? 'Medium' : 'Strong'} Password
                </span>
              </div>
            )}
            {!isLogin && (
              <ul className="password-requirements">
                <li style={{ color: formData.password.length >= 8 ? '#4CAF50' : '#999' }}>
                  ✓ At least 8 characters
                </li>
                <li style={{ color: /[A-Z]/.test(formData.password) ? '#4CAF50' : '#999' }}>
                  ✓ Uppercase letter
                </li>
                <li style={{ color: /[a-z]/.test(formData.password) ? '#4CAF50' : '#999' }}>
                  ✓ Lowercase letter
                </li>
                <li style={{ color: /\d/.test(formData.password) ? '#4CAF50' : '#999' }}>
                  ✓ Number
                </li>
                <li style={{ color: /[@$!%*?&]/.test(formData.password) ? '#4CAF50' : '#999' }}>
                  ✓ Special character (@$!%*?&)
                </li>
              </ul>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors([]);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                setPasswordStrength(0);
              }}
              className="toggle-button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <div className="auth-features">
          <p>✨ Secure • Verified • Professional</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
