import React, { useState, useRef } from 'react';
import axios from '../services/apiClient';
import '../styles/Profile.css';

const Profile = ({ user, onLogout, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile(prev => ({ ...prev, avatar: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.put('/api/auth/profile', {
        name: profile.name,
        bio: profile.bio,
        avatar: profile.avatar,
        preferredLanguages: profile.preferredLanguages
      });
      
      // Response is already unwrapped by apiClient interceptor
      if (response && response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal">
      <div className="profile-content">
        <button className="close-button" onClick={onClose}>✕</button>
        
        <div className="profile-header">
          <div className="profile-image-section">
            <div className="profile-image">
              {typeof profile.avatar === 'string' && profile.avatar.startsWith('data:') ? (
                <img src={profile.avatar} alt="Profile" />
              ) : (
                <div className="avatar-emoji">{profile.avatar || '👤'}</div>
              )}
            </div>
            {isEditing && (
              <button 
                className="change-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Change Photo
              </button>
            )}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div className="profile-info">
            {isEditing ? (
              <input 
                type="text"
                name="name"
                value={profile.name || ''}
                onChange={handleInputChange}
                className="profile-name-input"
                placeholder="Your Name"
              />
            ) : (
              <h2 className="profile-name">{profile.name || 'User'}</h2>
            )}
            <p className="profile-email">{profile.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-label">Rank</span>
            <span className="stat-value">{profile.statistics?.rank || 'Beginner'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Problems Solved</span>
            <span className="stat-value">{profile.statistics?.solvedProblems || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Streak</span>
            <span className="stat-value">🔥 {profile.statistics?.streak || 0} days</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{profile.statistics?.averageAccuracy || 0}%</span>
          </div>
        </div>

        {isEditing && (
          <div className="profile-bio-section">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profile.bio || ''}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              className="profile-bio-input"
              rows="4"
            />
          </div>
        )}

        <div className="profile-languages">
          <label>Preferred Languages</label>
          <div className="language-tags">
            {(profile.preferredLanguages || ['javascript']).map(lang => (
              <span key={lang} className="language-tag">{lang}</span>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button 
                className="btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : '✓ Save Changes'}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                ✕ Cancel
              </button>
            </>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => setIsEditing(true)}
            >
              ✎ Edit Profile
            </button>
          )}
          
          <button 
            className="btn-danger"
            onClick={onLogout}
          >
            🚪 Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
