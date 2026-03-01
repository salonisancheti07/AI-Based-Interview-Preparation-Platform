import { useState } from 'react';
import '../styles/Behavioral.css';
import axios from '../services/apiClient';

const PROMPTS = [
  {
    title: 'Tell me about yourself',
    guide: 'Use a tight 60–90 second elevator summary: current role → key strengths → proof points → what you want.'
  },
  {
    title: 'A time you resolved conflict',
    guide: 'STAR: Situation, Task, Action, Result. Emphasize listening, options considered, and measurable outcome.'
  },
  {
    title: 'Biggest mistake',
    guide: 'Pick a contained example, own it, show learning and what changed in your process.'
  },
  {
    title: 'Challenging stakeholder',
    guide: 'Show alignment, reframing goals, data you used, and how you preserved relationships.'
  }
];

export default function Behavioral() {
  const [active, setActive] = useState(PROMPTS[0]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const runBehavioral = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setFeedback('Scoring your answer...');
    const attempt = async (delayMs) => {
      try {
        const res = await axios.post('/api/ai/assist/behavioral', { answer });
        setFeedback(res?.feedback || 'No feedback returned. Ensure backend is running.');
        return true;
      } catch (err) {
        if (err?.response?.status === 429 && delayMs) {
          await new Promise((r) => setTimeout(r, delayMs));
          return false; // signal to retry
        }
        const msg = err?.response?.data?.message || err?.message || 'Failed to grade answer.';
        setFeedback(msg);
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
          <p className="kicker">STAR · Clarity · Impact</p>
          <h1>Practice Behavioral Answers</h1>
          <p>Pick a prompt, draft your answer, and refine for clarity and impact.</p>
        </div>
      </header>

      <main className="behavioral-main">
        <aside className="prompt-list">
          {PROMPTS.map((p) => (
            <button
              key={p.title}
              className={`prompt-card ${active.title === p.title ? 'active' : ''}`}
              onClick={() => setActive(p)}
            >
              <h4>{p.title}</h4>
              <p>{p.guide}</p>
            </button>
          ))}
        </aside>

        <section className="practice-area">
          <div className="prompt-header">
            <div>
              <h3>{active.title}</h3>
              <p>{active.guide}</p>
            </div>
            <div className="note">
              Aim for 60–120 seconds. Be specific. Close with the impact.
            </div>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Draft your STAR answer here..."
          />
          <div className="practice-hints">
            <span>Tips: Lead with the Situation/Task in 2 lines. Actions 3–5 bullets. Result with numbers.</span>
          </div>
          <div className="practice-actions">
            <button className="btn primary" onClick={runBehavioral} disabled={loading}>
              {loading ? 'Scoring…' : 'AI Grade (STAR)'}
            </button>
            <button className="btn ghost" onClick={() => { setAnswer(''); setFeedback(''); }} disabled={loading}>
              Clear
            </button>
          </div>
          {feedback && (
            <div className="feedback-box">
              <h4>Feedback</h4>
              <p>{feedback}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
