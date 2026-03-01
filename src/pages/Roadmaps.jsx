import React, { useState } from 'react';
import '../styles/Roadmaps.css';
import { generateLearningPath } from '../services/learningPathService';
import { useNavigate } from 'react-router-dom';

const ladders = [
  {
    id: 'dsa-a2z',
    title: 'DSA A2Z Roadmap',
    summary: 'Structured progression from basics to advanced DSA with checkpoints.',
    sections: [
      { title: 'Basics & Arrays', items: 10, done: 4 },
      { title: 'Two Pointers / Sliding Window', items: 12, done: 3 },
      { title: 'Recursion & Backtracking', items: 8, done: 2 },
      { title: 'DP Essentials', items: 16, done: 0 },
      { title: 'Graphs & Shortest Paths', items: 14, done: 0 }
    ]
  },
  {
    id: 'sd-a2z',
    title: 'System Design A2Z',
    summary: 'End‑to‑end system design prep with patterns, tradeoffs, and templates.',
    sections: [
      { title: 'Foundations & Tradeoffs', items: 6, done: 2 },
      { title: 'Caching / Storage Patterns', items: 8, done: 1 },
      { title: 'Scaling & Reliability', items: 10, done: 0 },
      { title: 'Case Studies', items: 12, done: 0 }
    ]
  }
];

const patterns = [
  { name: 'Two Pointers', tips: ['Opposite ends', 'Shrink window', 'Sort first when needed'] },
  { name: 'Sliding Window', tips: ['Grow then shrink', 'Track best length/sum', 'Handle negatives carefully'] },
  { name: 'Binary Search on Answer', tips: ['Monotonic condition', 'mid is feasible?', 'lo/hi invariant'] },
  { name: 'DP on Trees', tips: ['Postorder combine', 'Return pair (with/without)', 'Memo child states'] },
  { name: 'Prefix/Suffix', tips: ['Prefix arrays', 'Suffix precompute', 'Exclude self = prefix+suffix'] }
];

const companies = [
  { name: 'Google', repeats: 'High', rounds: ['DSA', 'System Design'], hot: ['Graphs', 'DP', 'Concurrency'] },
  { name: 'Amazon', repeats: 'High', rounds: ['DSA', 'LP/Behavioral'], hot: ['Arrays', 'Greedy', 'Leadership'] },
  { name: 'Microsoft', repeats: 'Medium', rounds: ['DSA', 'System Design'], hot: ['Trees', 'Bitmask', 'APIs'] },
  { name: 'Meta', repeats: 'Medium', rounds: ['DSA', 'System Design'], hot: ['DP', 'SQL', 'Scaling patterns'] }
];

const ProgressBar = ({ done, total }) => {
  const pct = Math.round((done / total) * 100);
  return (
    <div className="rm-progress">
      <div className="rm-progress-fill" style={{ width: `${pct}%` }} />
      <span className="rm-progress-text">{done}/{total} • {pct}%</span>
    </div>
  );
};

export default function Roadmaps() {
  const [role, setRole] = useState('Software Engineer');
  const [experience, setExperience] = useState('junior');
  const [goal, setGoal] = useState('Ace my next interviews');
  const [hours, setHours] = useState(2);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateLearningPath({ role, experience, goal, hoursPerDay: Number(hours) });
      setPlan(res);
    } catch (err) {
      setError('Could not generate plan. Check API key.');
    } finally {
      setLoading(false);
    }
  };

  const goToTrack = ({ category = 'all', searchTerm = '' }) => {
    navigate('/interview', { state: { category, searchTerm } });
  };

  const handleLadderContinue = (ladderId) => {
    if (ladderId === 'dsa-a2z') {
      goToTrack({ category: 'dsa', searchTerm: 'roadmap' });
    } else if (ladderId === 'sd-a2z') {
      goToTrack({ category: 'all', searchTerm: 'system design' });
    } else {
      goToTrack({});
    }
  };

  return (
    <div className="roadmaps-page">
      <div className="rm-hero">
        <div>
          <p className="rm-kicker">Guided Paths · Checkpoints · Practice</p>
          <h1>Structured Roadmaps to Clear Interviews Faster</h1>
          <p className="rm-sub">
            Follow curated ladders, learn patterns with cheat‑sheets, and focus on company‑specific rounds.
          </p>
          <div className="rm-cta-row">
            <a className="rm-btn primary" href="#ladders">Start a ladder</a>
            <a className="rm-btn ghost" href="#companies">Company prep</a>
          </div>
        </div>
        <div className="rm-hero-card">
          <h3>Today’s trio</h3>
          <ul>
            <li>Warm‑up: Two Sum (Two Pointers)</li>
            <li>Main: Longest Substring w/ K Repeats (Sliding Window)</li>
            <li>Speed‑run: Min Window Substring (Hard)</li>
          </ul>
        </div>
      </div>

      <section className="rm-section">
        <div className="rm-section-head">
          <h2>Personalized 30-day Plan</h2>
          <p>AI builds a daily roadmap based on your role, experience, and available time.</p>
        </div>
        <div className="rm-plan-grid">
          <div className="rm-plan-form">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Software Engineer</option>
              <option>Data Scientist</option>
              <option>Machine Learning Engineer</option>
              <option>Backend Engineer</option>
              <option>Frontend Engineer</option>
            </select>

            <label>Experience</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>

            <label>Goal</label>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} />

            <label>Hours per day</label>
            <input type="number" min="1" max="8" value={hours} onChange={(e) => setHours(e.target.value)} />

            <button className="rm-btn primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
            {error && <p className="rm-error">{error}</p>}
          </div>

          <div className="rm-plan-preview">
            {!plan && <p className="muted">Generate to see your day-by-day plan.</p>}
            {plan && (
              <div className="plan-scroll">
                {Array.isArray(plan.plan) && plan.plan.slice(0, 10).map((day, idx) => (
                  <div key={idx} className="plan-card">
                    <h4>Day {day.day || idx + 1}</h4>
                    <p><strong>Topics:</strong> {(day.topics || []).join(', ')}</p>
                    <p><strong>Practice:</strong> {(day.practice || []).join(', ')}</p>
                    <p><strong>Resources:</strong> {(day.resources || []).join(', ')}</p>
                  </div>
                ))}
                {plan.checkpoints && (
                  <div className="checkpoint-block">
                    <h4>Weekly checkpoints</h4>
                    <ul>
                      {plan.checkpoints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="ladders" className="rm-section">
        <div className="rm-section-head">
          <h2>Roadmaps with Checkpoints</h2>
          <p>Advance only when you pass quick quizzes; get “ready to advance” signals.</p>
        </div>
        <div className="rm-grid">
          {ladders.map((ladder) => (
            <div key={ladder.id} className="rm-card">
              <div className="rm-card-head">
                <h3>{ladder.title}</h3>
                <p>{ladder.summary}</p>
              </div>
              <div className="rm-steps">
                {ladder.sections.map((sec) => (
                  <div key={sec.title} className="rm-step">
                    <div>
                      <h4>{sec.title}</h4>
                      <span>{sec.items} items</span>
                    </div>
                    <ProgressBar done={sec.done} total={sec.items} />
                  </div>
                ))}
              </div>
              <button className="rm-btn primary" onClick={() => handleLadderContinue(ladder.id)}>
                Continue
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="patterns" className="rm-section">
        <div className="rm-section-head">
          <h2>Patterns Cheat‑sheets</h2>
          <p>Quick reminders for the patterns that unlock most interview problems.</p>
        </div>
        <div className="rm-grid patterns">
          {patterns.map((pat) => (
            <div key={pat.name} className="rm-chip-card">
              <h4>{pat.name}</h4>
              <ul>
                {pat.tips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="companies" className="rm-section">
        <div className="rm-section-head">
          <h2>Company Tracks</h2>
          <p>Question sets and mock rounds with repeat‑frequency badges.</p>
        </div>
        <div className="rm-grid companies">
          {companies.map((c) => (
            <div key={c.name} className="rm-card compact">
              <div className="rm-card-head">
                <h3>{c.name}</h3>
                <span className={`badge repeat-${c.repeats.toLowerCase()}`}>{c.repeats} repeat</span>
              </div>
              <p className="rm-meta">Rounds: {c.rounds.join(', ')}</p>
              <p className="rm-meta">Hot topics: {c.hot.join(', ')}</p>
              <button className="rm-btn ghost" onClick={() => goToTrack({ category: 'dsa', searchTerm: c.name })}>
                Open track
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
