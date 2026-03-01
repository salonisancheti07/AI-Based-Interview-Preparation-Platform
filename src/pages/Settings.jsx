import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import '../styles/Settings.css';

const SOLVED_DATES_KEY = 'dailySolvedDates';

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseSolvedDates = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SOLVED_DATES_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw)].sort();
  } catch {
    return [];
  }
};

const buildActivity = () => {
  const dates = parseSolvedDates();
  const set = new Set(dates);
  const days = [];
  const monthMarkers = [];

  for (let i = 364; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const active = set.has(key);
    const weekIndex = Math.floor(days.length / 7) + 1;
    if (d.getDate() === 1) {
      monthMarkers.push({ key, label: d.toLocaleString('default', { month: 'short' }), col: weekIndex });
    }
    days.push({ key, active });
  }

  // compute max streak
  let best = 0;
  let running = 0;
  let prev = null;
  dates.forEach((d) => {
    if (prev) {
      const diff = Math.round((new Date(`${d}T00:00:00`) - new Date(`${prev}T00:00:00`)) / (24 * 60 * 60 * 1000));
      if (diff === 1) {
        running += 1;
      } else {
        running = 1;
      }
    } else {
      running = 1;
    }
    if (running > best) best = running;
    prev = d;
  });

  return { days, activeCount: set.size, maxStreak: best, monthMarkers };
};

export default function Settings() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    dailyReminders: true,
    shareProgress: false,
    darkMode: false,
    weeklyGoal: 5
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activity, setActivity] = useState(() => buildActivity());

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingPrefs(true);
      try {
        const response = await axios.get('/api/auth/me');
        if (response?.success && response?.user?.preferences) {
          setPrefs(response.user.preferences);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load settings');
      } finally {
        setLoadingPrefs(false);
      }
    };
    loadSettings();
    setActivity(buildActivity());
  }, []);

  const updatePreference = (field, value) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.put('/api/auth/preferences', prefs);
      if (!response?.success) throw new Error(response?.message || 'Failed to save preferences');
      localStorage.setItem('user', JSON.stringify(response.user));
      setMessage('Preferences updated');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage('');
    setError('');
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Fill current and new password');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await axios.put('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (!response?.success) throw new Error(response?.message || 'Failed to update password');
      setMessage('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back" onClick={() => navigate('/dashboard')}>Back</button>
        <h1>Settings</h1>
      </div>

      {message && <div className="settings-message success">{message}</div>}
      {error && <div className="settings-message error">{error}</div>}

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-section">
            <h2>Activity (last 12 months)</h2>
            <p className="settings-sub">Days you solved or practiced questions.</p>
            <div className="activity-meta">
              <span>Total active days: <strong>{activity.activeCount}</strong></span>
              <span>Max streak: <strong>{activity.maxStreak}</strong></span>
            </div>
            <div className="activity-wrap">
              {activity.activeCount === 0 && (
                <p className="activity-empty">No activity tracked yet. Solve a problem to start your heatmap.</p>
              )}
              <div className="activity-grid">
                {activity.days.map((day) => (
                  <div
                    key={day.key}
                    className={`activity-cell ${day.active ? 'on' : 'off'}`}
                    title={`${day.key} • ${day.active ? 'Active' : 'Inactive'}`}
                    aria-label={`${day.key} ${day.active ? 'active' : 'inactive'}`}
                  />
                ))}
              </div>
              <div className="activity-months">
                {activity.monthMarkers.map((m) => (
                  <div key={m.key} className="month-label" style={{ gridColumn: m.col }}>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-section">
            <h2>Notifications & Preferences</h2>
            <p className="settings-sub">Tune reminders and sharing.</p>
            {loadingPrefs ? (
              <p>Loading...</p>
            ) : (
              <>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={prefs.emailNotifications}
                    onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                  />
                  <span>Email notifications</span>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={prefs.dailyReminders}
                    onChange={(e) => updatePreference('dailyReminders', e.target.checked)}
                  />
                  <span>Daily reminders</span>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={prefs.shareProgress}
                    onChange={(e) => updatePreference('shareProgress', e.target.checked)}
                  />
                  <span>Share progress with peers</span>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={prefs.darkMode}
                    onChange={(e) => updatePreference('darkMode', e.target.checked)}
                  />
                  <span>Dark mode preference</span>
                </label>
                <label className="settings-input">
                  Weekly goal (problems)
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={prefs.weeklyGoal}
                    onChange={(e) => updatePreference('weeklyGoal', Number(e.target.value))}
                  />
                </label>
                <div className="settings-actions">
                  <button className="settings-btn primary" onClick={handleSavePreferences} disabled={savingPrefs}>
                    {savingPrefs ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-section">
            <h2>Change Password</h2>
            <p className="settings-sub">Keep your account secure.</p>
            <label className="settings-input">
              Current password
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            </label>
            <label className="settings-input">
              New password
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </label>
            <label className="settings-input">
              Confirm new password
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </label>
            <div className="settings-actions">
              <button className="settings-btn danger" onClick={handleChangePassword} disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
