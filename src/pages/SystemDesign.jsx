import { useState } from 'react';
import '../styles/Behavioral.css';
import axios from '../services/apiClient';

const SCENARIOS = [
  {
    title: 'Design a URL shortener',
    steps: ['APIs & traffic', 'Schema & storage', 'Hash strategy', 'Reads/Writes', 'Cache/CDN', 'Analytics', 'Scaling & failures']
  },
  {
    title: 'Design a chat system',
    steps: ['Requirements', 'Protocols', 'Message fanout', 'Ordering/delivery', 'Storage models', 'Presence', 'Scale & failures']
  },
  {
    title: 'Design news feed',
    steps: ['Fanout on write/read', 'Ranking signals', 'Cache strategy', 'Cold start', 'Pagination', 'Backfill', 'Monitoring']
  }
];

export default function SystemDesign() {
  const [active, setActive] = useState(SCENARIOS[0]);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const runReview = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    setFeedback({ text: 'Reviewing your outline...' });

    const attempt = async (delayMs) => {
      try {
        const res = await axios.post('/api/ai/assist/system-design', { scenario: active.title, notes });
        setFeedback(res?.feedback || res);
        return true;
      } catch (err) {
        if (err?.response?.status === 429 && delayMs) {
          await new Promise((r) => setTimeout(r, delayMs));
          return false;
        }
        setFeedback({ error: err?.response?.data?.message || err?.message || 'Review failed.' });
        return true;
      }
    };

    let done = await attempt(0);
    if (!done) done = await attempt(5000);
    if (!done) await attempt(15000);
    setLoading(false);
  };

  return (
    <div className="behavioral-page">
      <header className="behavioral-hero">
        <div>
          <p className="kicker">Structure · Trade-offs · Scale</p>
          <h1>System Design Sandbox</h1>
          <p>Pick a scenario, outline components, and capture trade-offs.</p>
        </div>
      </header>

      <main className="behavioral-main">
        <aside className="prompt-list">
          {SCENARIOS.map((s) => (
            <button
              key={s.title}
              className={`prompt-card ${active.title === s.title ? 'active' : ''}`}
              onClick={() => setActive(s)}
            >
              <h4>{s.title}</h4>
              <p>{s.steps.join(' · ')}</p>
            </button>
          ))}
        </aside>

        <section className="practice-area">
          <div className="prompt-header">
            <div>
              <h3>{active.title}</h3>
              <p>Checklist: {active.steps.join(' → ')}</p>
            </div>
            <div className="note">
              Tip: start with requirements & constraints, then draw the core flow, then scale.
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Outline components, data flow, bottlenecks, scaling, and trade-offs..."
          />
          <div className="practice-hints">
            <span>Cover: APIs, storage, consistency, caching, queueing, failures, monitoring.</span>
          </div>
          <div className="practice-actions">
            <button className="btn primary" onClick={runReview} disabled={loading}>
              {loading ? 'Reviewing…' : 'AI Review'}
            </button>
            <button className="btn ghost" onClick={() => { setNotes(''); setFeedback(null); }} disabled={loading}>
              Clear
            </button>
          </div>
          {feedback && (
            <div className="feedback-box">
              <h4>Feedback</h4>
              {feedback.error && <p>{feedback.error}</p>}
              {feedback.overall !== undefined && (
                <p><strong>Overall:</strong> {Math.round(feedback.overall)} / 100</p>
              )}
              {feedback.coverage !== undefined && (
                <p><strong>Coverage:</strong> {Math.round(feedback.coverage)} / 100</p>
              )}
              {feedback.tradeoffs !== undefined && (
                <p><strong>Trade-offs:</strong> {Math.round(feedback.tradeoffs)} / 100</p>
              )}
              {Array.isArray(feedback.strengths) && (
                <ul>
                  {feedback.strengths.map((s, i) => <li key={`str-${i}`}>{s}</li>)}
                </ul>
              )}
              {Array.isArray(feedback.risks) && (
                <ul>
                  {feedback.risks.map((s, i) => <li key={`risk-${i}`}>{s}</li>)}
                </ul>
              )}
              {Array.isArray(feedback.next_steps) && (
                <ul>
                  {feedback.next_steps.map((s, i) => <li key={`next-${i}`}>{s}</li>)}
                </ul>
              )}
              {feedback.fallback && <p className="muted">Fallback rubric used due to rate limit.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
