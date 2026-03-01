import React, { useRef, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/ProfileSetup.css';

const LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'golang', 'typescript', 'rust', 'sql'];

export default function ProfileSetup({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || 'U',
    preferredLanguages: user?.preferredLanguages || ['javascript'],
    targetRole: user?.targetRole || '',
    experienceLevel: user?.experienceLevel || 'Beginner',
    companyGoal: user?.companyGoal || ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const value = event.target?.result;
      if (!value) return;
      setImagePreview(value);
      setProfileData((prev) => ({ ...prev, avatar: value }));
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguageToggle = (language) => {
    setProfileData((prev) => ({
      ...prev,
      preferredLanguages: prev.preferredLanguages.includes(language)
        ? prev.preferredLanguages.filter((item) => item !== language)
        : [...prev.preferredLanguages, language]
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      if (!response?.success) throw new Error(response?.message || 'Failed to save profile');
      localStorage.setItem('user', JSON.stringify(response.user));
      setStep(3);
      setTimeout(() => onComplete(response.user), 1000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <div className="setup-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <p>Photo</p>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <p>Details</p>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <p>Done</p>
          </div>
        </div>

        {step === 1 && (
          <div className="setup-step step-image">
            <h2>Upload Profile Photo</h2>
            <p>Add a clear photo for your profile</p>
            <div className="image-upload-area">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : typeof profileData.avatar === 'string' && profileData.avatar.startsWith('data:') ? (
                  <img src={profileData.avatar} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">{profileData.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                )}
              </div>
              <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
                Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <p className="upload-hint">JPG, PNG, GIF or WebP. Max 5MB</p>
            </div>
            <button className="next-button" onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step step-details">
            <h2>Complete Your Profile</h2>
            <p>Tell us about your interview goals</p>
            <div className="setup-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={profileData.name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profileData.email} disabled className="disabled-field" />
              </div>
              <div className="form-group">
                <label>Target Role</label>
                <input type="text" name="targetRole" value={profileData.targetRole} onChange={handleInputChange} placeholder="Frontend Developer" />
              </div>
              <div className="form-group">
                <label>Experience Level</label>
                <select name="experienceLevel" value={profileData.experienceLevel} onChange={handleInputChange}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label>Company Goal</label>
                <input type="text" name="companyGoal" value={profileData.companyGoal} onChange={handleInputChange} placeholder="Google, Amazon, Microsoft" />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea name="bio" value={profileData.bio} onChange={handleInputChange} rows="4" />
              </div>
              <div className="form-group">
                <label>Preferred Programming Languages</label>
                <div className="language-selector">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language}
                      className={`language-button ${profileData.preferredLanguages.includes(language) ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLanguageToggle(language);
                      }}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="setup-buttons">
              <button className="back-button" onClick={() => setStep(1)}>Back</button>
              <button className="save-button" onClick={handleSaveProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step step-complete">
            <div className="success-icon">OK</div>
            <h2>Profile Complete</h2>
            <p>Welcome, {profileData.name}</p>
            <p className="redirect-text">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
