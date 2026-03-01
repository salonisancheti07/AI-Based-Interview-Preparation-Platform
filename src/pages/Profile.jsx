import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import { jsPDF } from 'jspdf';
import '../styles/Profile.css';

// small inline SVG donut for readiness
function ReadinessCircle({ score }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width="120" height="120" className="readiness-chart">
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke="#24344f"
        strokeWidth="10"
        fill="none"
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        stroke="#ffa116"
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fontSize="20"
        fill="#ffa116"
        fontFamily="SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace"
      >
        {score}%
      </text>
    </svg>
  );
}


const LANGUAGE_OPTIONS = ['javascript', 'python', 'java', 'cpp', 'golang', 'typescript', 'rust', 'sql'];

function mapSkillsToLangs(skills = []) {
  const langs = new Set();
  (skills || []).forEach((s) => {
    const t = String(s).toLowerCase();
    if (t.includes('javascript') || t.includes('react') || t.includes('node')) langs.add('javascript');
    if (t.includes('python')) langs.add('python');
    if (t.includes('java') && !t.includes('javascript')) langs.add('java');
    if (t.includes('c++') || t.includes('cpp')) langs.add('cpp');
    if (t.includes('go') || t.includes('golang')) langs.add('golang');
    if (t.includes('typescript')) langs.add('typescript');
    if (t.includes('rust')) langs.add('rust');
    if (t.includes('sql')) langs.add('sql');
    if (t.includes('c#') || t.includes('csharp')) langs.add('csharp');
  });
  // keep intersection with supported options
  return Array.from(langs).filter((l) => LANGUAGE_OPTIONS.includes(l));
}
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
    const col = Math.floor(days.length / 7) + 1;
    if (d.getDate() === 1) {
      monthMarkers.push({ key, label: d.toLocaleString('default', { month: 'short' }), col });
    }
    days.push({ key, active });
  }
  let best = 0;
  let running = 0;
  let prev = null;
  dates.forEach((d) => {
    if (prev) {
      const diff = Math.round((new Date(`${d}T00:00:00`) - new Date(`${prev}T00:00:00`)) / (24 * 60 * 60 * 1000));
      if (diff === 1) running += 1;
      else running = 1;
    } else {
      running = 1;
    }
    best = Math.max(best, running);
    prev = d;
  });
  return { days, activeCount: set.size, maxStreak: best, monthMarkers };
};

function getReadiness(statistics = {}) {
  const solved = statistics.solvedProblems || 0;
  const attempted = statistics.attemptedProblems || 0;
  const accuracy = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;
  const streak = statistics.streak || 0;
  const score = Math.min(100, Math.round((solved * 2) + (accuracy * 0.5) + (streak * 2)));
  if (score >= 80) return { label: 'Advanced', score };
  if (score >= 55) return { label: 'Intermediate', score };
  return { label: 'Starter', score };
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activity] = useState(() => buildActivity());
  const [avatarFile, setAvatarFile] = useState(null); // for uploading new avatar
  const [resumeFile, setResumeFile] = useState(null); // for uploading resume

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, banner: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        setFormData((prev) => ({ ...prev, resume: dataUrl }));

        try {
          const payload = { resumeData: dataUrl, fileName: file.name };
          const resp = await axios.post('/api/ai/resume/upload', payload);
          const res = resp?.data;
          if (res?.success && res.resumeData) {
            const parsed = res.resumeData;
            // Map parsed fields into formData
            setFormData((prev) => {
              const next = { ...(prev || {}) };
              if (parsed.personalInfo?.fullName) next.name = parsed.personalInfo.fullName;
              if (parsed.personalInfo?.email) next.email = parsed.personalInfo.email;
              if (parsed.personalInfo?.summary) next.bio = parsed.personalInfo.summary;
              if (parsed.personalInfo?.targetRole) next.targetRole = parsed.personalInfo.targetRole;
              // map skills to app languages
              const mapped = mapSkillsToLangs(parsed.skills || []);
              if (mapped && mapped.length) next.preferredLanguages = mapped;
              return next;
            });
            alert('Resume parsed — profile fields prefilled. Click Save to persist changes.');
          } else {
            alert('Resume uploaded but parsing returned no data.');
          }
        } catch (err) {
          console.error('Resume parse/upload failed', err?.response || err);
          alert('Failed to parse resume. It was still attached to your profile locally.');
        }
      };
      reader.readAsDataURL(file);
    }
  }; 

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (!response?.success) throw new Error(response?.message || 'Failed to load profile');
        setUser(response.user);
        setFormData({
          name: response.user.name || '',
          bio: response.user.bio || '',
          targetRole: response.user.targetRole || '',
          experienceLevel: response.user.experienceLevel || 'Beginner',
          companyGoal: response.user.companyGoal || '',
          preferredLanguages: response.user.preferredLanguages || ['javascript'],
          languageProficiency: response.user.languageProficiency || {},
          github: response.user.github || '',
          linkedin: response.user.linkedin || '',
          country: response.user.country || '',
          avatar: response.user.avatar || '',
          banner: response.user.banner || '',
          resume: response.user.resume || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const readiness = useMemo(() => getReadiness(user?.statistics), [user]);

  const handleDownloadResume = () => {
    const dataUrl = formData?.resume || user?.resume;
    if (!dataUrl) {
      alert('No resume uploaded yet');
      return;
    }
    let filename = 'resume';
    const m = dataUrl.match(/^data:(.+);base64,/);
    if (m) {
      const mime = m[1];
      const ext = mime.split('/')[1] || 'bin';
      filename += '.' + ext;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    if (!user) return;
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      let y = 40;
      doc.setFontSize(18);
      doc.text(user.name || 'Unnamed', 40, y);
      y += 24;
      doc.setFontSize(12);
      if (user.email) { doc.text(`Email: ${user.email}`, 40, y); y += 18; }
      if (user.targetRole) { doc.text(`Target Role: ${user.targetRole}`, 40, y); y += 18; }
      if (user.experienceLevel) { doc.text(`Experience: ${user.experienceLevel}`, 40, y); y += 18; }
      if (user.bio) {
        const split = doc.splitTextToSize(`Bio: ${user.bio}`, 520);
        doc.text(split, 40, y);
        y += split.length * 14 + 8;
      }
      if (user.github) { doc.text(`GitHub: https://github.com/${user.github}`, 40, y); y += 16; }
      if (user.linkedin) { doc.text(`LinkedIn: ${user.linkedin}`, 40, y); y += 16; }
      // add simple stats
      const statistics = user.statistics || {};
      y += 8;
      doc.text('---', 40, y); y += 12;
      doc.text(`Solved: ${statistics.solvedProblems || 0}`, 40, y); y += 14;
      doc.text(`Attempted: ${statistics.attemptedProblems || 0}`, 40, y); y += 14;
      doc.text(`Streak: ${statistics.streak || 0} days`, 40, y); y += 20;

      // If resume is a data URL PDF, attach as new page (best-effort)
      const resumeData = formData?.resume || user?.resume;
      if (resumeData && resumeData.startsWith('data:application/pdf')) {
        try {
          const binary = atob(resumeData.split(',')[1]);
          const len = binary.length;
          const uint8 = new Uint8Array(len);
          for (let i = 0; i < len; i++) uint8[i] = binary.charCodeAt(i);
          // embedding existing PDF pages into jsPDF is non-trivial without additional libs;
          // instead, we offer the main profile PDF and preserve resume as downloadable separately.
        } catch (e) {
          // ignore embed errors
        }
      }

      const filename = `${(user.name || 'profile').replace(/\s+/g, '_')}_Profile.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Export PDF failed', err);
      alert('Failed to export PDF');
    }
  };

  const stats = useMemo(() => {
    const statistics = user?.statistics || {};
    const solved = statistics.solvedProblems || 0;
    const attempted = statistics.attemptedProblems || 0;
    return [
      { label: 'Solved', value: solved },
      { label: 'Attempted', value: attempted },
      { label: 'Accuracy', value: attempted > 0 ? `${Math.round((solved / attempted) * 100)}%` : '0%' },
      { label: 'Streak', value: `${statistics.streak || 0} days` },
      { label: 'Tests Passed', value: statistics.totalTestsPassed || 0 },
      { label: 'Rank', value: user?.rank || 'Beginner' }
    ];
  }, [user]);

  const achievements = useMemo(() => {
    const solved = user?.statistics?.solvedProblems || 0;
    const streak = user?.statistics?.streak || 0;
    const attempted = user?.statistics?.attemptedProblems || 0;
    const accuracy = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;
    return [
      { title: 'Consistency', detail: streak >= 7 ? '7+ day streak unlocked' : 'Build a 7-day streak', unlocked: streak >= 7 },
      { title: 'Problem Solver', detail: solved >= 25 ? 'Solved 25+ problems' : 'Solve 25 problems', unlocked: solved >= 25 },
      { title: 'Precision', detail: accuracy >= 75 ? '75%+ accuracy achieved' : 'Reach 75% accuracy', unlocked: accuracy >= 75 }
    ];
  }, [user]);

  const recommendations = useMemo(() => {
    const recs = [];
    if (readiness.score < 60) {
      recs.push({ title: 'Daily Warmup', action: 'Do a 20‑min quick practice to lift readiness above 60%' });
    }
    const accuracyStat = stats.find((s) => s.label === 'Accuracy')?.value || '0%';
    recs.push({
      title: 'Targeted Mock',
      action: `Run a mock interview for ${user?.targetRole || 'your target role'} this week`
    });
    recs.push({
      title: 'Review Reports',
      action: 'Check Interview Reports and note top 3 weaknesses'
    });
    recs.push({
      title: 'Language Depth',
      action: `Solve 3 problems in ${user?.preferredLanguages?.[0] || 'your main language'} to stay sharp`
    });
    return recs.slice(0, 3);
  }, [readiness, stats, user]);

  const handleLanguageToggle = (language) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const hasLanguage = prev.preferredLanguages.includes(language);
      const newLangs = hasLanguage
        ? prev.preferredLanguages.filter((item) => item !== language)
        : [...prev.preferredLanguages, language];
      const newProf = { ...prev.languageProficiency };
      if (hasLanguage) {
        delete newProf[language];
      } else {
        newProf[language] = 50;
      }
      return {
        ...prev,
        preferredLanguages: newLangs,
        languageProficiency: newProf
      };
    });
  };

  const handleSave = async () => {
    if (!formData) return;
    // Front-end required fields
    if (!formData.github || !formData.linkedin || !formData.country) {
      setError('GitHub ID, LinkedIn URL, and Country are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const response = await axios.put('/api/auth/profile', formData);
      if (!response?.success) throw new Error(response?.message || 'Failed to save profile');
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Profile link copied!');
    }).catch(() => {
      alert('Unable to copy link');
    });
  };

  const handleDownloadCV = () => {
    // build simple CV text from profile data
    if (!user) return;
    const lines = [];
    lines.push(`Name: ${user.name}`);
    lines.push(`Email: ${user.email}`);
    if (user.targetRole) lines.push(`Target Role: ${user.targetRole}`);
    if (user.experienceLevel) lines.push(`Experience: ${user.experienceLevel}`);
    if (user.bio) lines.push(`Bio: ${user.bio}`);
    if (user.github) lines.push(`GitHub: https://github.com/${user.github}`);
    if (user.linkedin) lines.push(`LinkedIn: ${user.linkedin}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${user.name.replace(/\s+/g, '_')}_CV.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!user || !formData) {
    return (
      <div className="profile-loading">
        <p>{error || 'Profile unavailable'}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <button className="profile-back" onClick={() => navigate('/dashboard')}>Back</button>
        <h1>Profile</h1>
        <button className="profile-edit" onClick={() => setIsEditing((prev) => !prev)}>
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {error && <div className="profile-error">{error}</div>}

<section
          className="profile-banner"
          style={
            formData.banner
              ? { '--banner-url': `url(${formData.banner})` }
              : {}
          }
        >
        <div className="profile-hero">
          <div className="profile-avatar-wrap avatar-ring" style={{'--readiness': `${readiness.score * 3.6}deg`}}>
            {typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
              <img className="profile-avatar" src={user.avatar} alt="Avatar" />
            ) : typeof user.avatar === 'string' && user.avatar.startsWith('data:') ? (
              <img className="profile-avatar" src={user.avatar} alt="Avatar" />
            ) : (
              <div className="profile-avatar-fallback">{(user.name || 'U').charAt(0).toUpperCase()}</div>
            )}
            {isEditing && (
              <>
                <label className="avatar-upload">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                  📷
                </label>
                <label className="banner-upload">
                  <input type="file" accept="image/*" onChange={handleBannerChange} />
                  🖼️
                </label>
              </>
            )}
          </div>

          <div className="profile-identity">
            <h2>{user.name}</h2>
            <p className="profile-tagline">{readiness.label} {user.targetRole ? `| ${user.targetRole}` : ''}</p>
            <p className="profile-email">{user.email}</p>
            <div className="social-row">
              {user.github && (
                <a href={`https://github.com/${user.github}`} target="_blank" rel="noreferrer" className="social-link github">🐙 GitHub</a>
              )}
              {user.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noreferrer" className="social-link linkedin">🔗 LinkedIn</a>
              )}
            </div>
            <div className="profile-meta">
              <span>{user.targetRole || 'Target role not set'}</span>
              <span>{user.experienceLevel || 'Beginner'}</span>
              <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
              <span>{user.country || 'Country not set'}</span>
            </div>
            <p className="profile-bio">{user.bio || 'Add a short bio about your preparation goals.'}</p>
            <div className="cta-row">
              <button className="btn-ghost" onClick={() => navigate('/mock-interview')}>Start Mock Interview</button>
              <button className="btn-ghost" onClick={() => navigate('/interview-report')}>View Reports</button>
            </div>
          </div>

          <div className="profile-readiness">
            <ReadinessCircle score={readiness.score} />
            <div className="readiness-label">{readiness.label}</div>
            <div className="readiness-caption">Interview Readiness</div>
            <div className="share-row">
              <button className="btn-share" onClick={handleCopyLink}>Copy Link</button>
              <button className="btn-share" onClick={handleDownloadCV}>Download CV</button>
              <button className="btn-share" onClick={handleExportPDF}>Export PDF</button>
              {user?.resume || formData?.resume ? (
                <button className="btn-share" onClick={handleDownloadResume}>Download Resume</button>
              ) : null}
              {isEditing && (
                <label className="resume-upload">
                  <input type="file" accept="*/*" onChange={handleResumeChange} />
                  📄 Upload Resume
                </label>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-card">
          <h3>Performance</h3>
          <div className="profile-stats-grid">
            {stats.map((item) => (
              <div key={item.label} className="profile-stat-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-card">
          <h3>Focus Areas</h3>
          <p className="card-subtitle">Inspired by top interview prep platforms: role, language stack, and consistency targets.</p>
          <div className="tags-row">
            {(user.preferredLanguages || []).map((language) => (
              <span key={language} className="tag">{language}</span>
            ))}
          </div>
          <div className="goal-row">
            <span>Company Goal</span>
            <strong>{user.companyGoal || 'Not set'}</strong>
          </div>
        </div>

        <div className="profile-card">
          <h3>Skills & Proficiency</h3>
          <p className="card-subtitle">Track how confident you are in each language.</p>
          <div className="skills-list">
            {(formData.preferredLanguages || []).map((lang) => {
              const prof = (formData.languageProficiency || {})[lang] || 50;
              return (
                <div key={lang} className="skill-row">
                  <span className="skill-name">{lang}</span>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${prof}%` }} />
                  </div>
                  <span className="skill-percent">{prof}%</span>
                </div>
              );
            })}
          </div>
        </div>

          <div className="profile-card">
            <h3>Achievements</h3>
            <div className="achievement-list">
              {achievements.map((achievement) => (
                <div key={achievement.title} className={`achievement-item ${achievement.unlocked ? 'unlocked' : ''}`}>
                  {achievement.unlocked && <span className="ach-icon">🏅</span>}
                  <strong>{achievement.title}</strong>
                  <span>{achievement.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <h3>Resume</h3>
            <p className="card-subtitle">Upload your resume here for easy download.</p>
            {formData?.resume || user?.resume ? (
              <button className="btn-share" onClick={handleDownloadResume}>Download Resume</button>
            ) : (
              <p>No resume uploaded.</p>
            )}
            {isEditing && (
              <label className="resume-upload" style={{marginTop: '10px'}}>
                <input type="file" accept="*/*" onChange={handleResumeChange} />
                📄 Upload Resume
              </label>
            )}
          </div>

        <div className="profile-card">
          <h3>Next Actions</h3>
          <p className="card-subtitle">Quick wins to boost your readiness.</p>
          <ul className="action-list">
            {recommendations.map((rec) => (
              <li key={rec.title}>
                <strong>{rec.title}</strong>
                <span>{rec.action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="profile-card activity-card wide">
          <h3>Activity (last 12 months)</h3>
          <p className="card-subtitle">Days you were active on this platform.</p>
          <div className="activity-meta">
            <span>Total active days: <strong>{activity.activeCount}</strong></span>
            <span>Max streak: <strong>{activity.maxStreak}</strong></span>
          </div>
          <div className="activity-wrap profile">
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
      </section>

      {isEditing && (
        <section className="profile-card edit-card">
          <h3>Edit Profile</h3>
          <div className="edit-grid">
            <label>
              Full Name
              <input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label>
              Target Role
              <input
                value={formData.targetRole}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetRole: e.target.value }))}
              />
            </label>
            <label>
              Experience Level
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData((prev) => ({ ...prev, experienceLevel: e.target.value }))}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label>
              Company Goal
              <input
                value={formData.companyGoal}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyGoal: e.target.value }))}
                placeholder="Example: Google, Amazon, Microsoft"
              />
            </label>
            <label>
              GitHub ID <span className="required">*</span>
              <input
                value={formData.github}
                onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value.trim() }))}
                placeholder="github-username"
              />
            </label>
            <label>
              LinkedIn URL <span className="required">*</span>
              <input
                value={formData.linkedin}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value.trim() }))}
                placeholder="https://www.linkedin.com/in/your-id"
              />
            </label>
            <label>
              Country <span className="required">*</span>
              <input
                value={formData.country}
                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="India, USA, ..."
              />
            </label>
            <label className="full-width">
              Bio
              <textarea
                rows="4"
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </label>
            <div className="full-width">
              <span className="input-label">Preferred Languages</span>
              <div className="language-options">
                {LANGUAGE_OPTIONS.map((language) => (
                  <button
                    key={language}
                    className={formData.preferredLanguages.includes(language) ? 'lang-btn selected' : 'lang-btn'}
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
            {formData.preferredLanguages.length > 0 && (
              <div className="full-width">
                <span className="input-label">Language Proficiency (%)</span>
                {formData.preferredLanguages.map((lang) => (
                  <div key={lang} className="proficiency-row">
                    <label>{lang}</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(formData.languageProficiency[lang] || 50)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFormData((prev) => ({
                          ...prev,
                          languageProficiency: {
                            ...prev.languageProficiency,
                            [lang]: val
                          }
                        }));
                      }}
                    />
                    <span>{(formData.languageProficiency[lang] || 50)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="edit-actions">
            <button className="save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <button className="cancel" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </section>
      )}
    </div>
  );
}
