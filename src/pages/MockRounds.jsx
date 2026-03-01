import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MockRounds.css';

const roundTypes = [
  { title: 'DS/Algo Round', duration: '45 min', focus: 'Coding + explanations', slots: 'Anytime' },
  { title: 'System Design', duration: '60 min', focus: 'High-level + deep dives', slots: 'Anytime' },
  { title: 'Behavioral (LP)', duration: '30 min', focus: 'STAR answers, leadership signals', slots: 'Anytime' }
];

const rubric = [
  { area: 'Problem Framing', weight: '20%', detail: 'Clarify requirements, constraints, edge cases' },
  { area: 'Approach & Optimality', weight: '30%', detail: 'Complexity, patterns, tradeoffs' },
  { area: 'Code Quality', weight: '25%', detail: 'Correctness, structure, tests' },
  { area: 'Communication', weight: '15%', detail: 'Think-aloud, concise updates' },
  { area: 'Resilience', weight: '10%', detail: 'Handles hints, fixes errors quickly' }
];

export default function MockRounds() {
  const navigate = useNavigate();

  return (
    <div className="mock-page">
      <div className="mock-hero">
        <div>
          <p className="kicker">Simulated Rounds · Scoring Rubric · Playback</p>
          <h1>Run realistic mock interviews</h1>
          <p className="sub">Pick a round type, get timed prompts, rubric-based feedback, and playback to review.</p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => navigate('/mock-interview', { state: { interviewType: 'technical' } })}>
              Start DS/Algo now
            </button>
            <button className="btn ghost" onClick={() => navigate('/mock-interview', { state: { interviewType: 'mixed' } })}>
              Start System Design
            </button>
          </div>
        </div>
        <div className="mock-hero-card">
          <h3>Whiteboard Mode</h3>
          <p>Use the built-in canvas to sketch diagrams and step-by-step logic.</p>
          <button className="btn small ghost" onClick={() => navigate('/mock-interview', { state: { interviewType: 'technical', mode: 'whiteboard' } })}>
            Open whiteboard
          </button>
        </div>
      </div>

      <div className="mock-grid">
        {roundTypes.map((r) => (
          <div key={r.title} className="mock-card">
            <div className="card-head">
              <h3>{r.title}</h3>
              <span className="pill">{r.duration}</span>
            </div>
            <p className="meta">{r.focus}</p>
            <p className="meta">Slots: {r.slots}</p>
            <button
              className="btn small primary"
              onClick={() => {
                const val = r.title.toLowerCase();
                const interviewType = val.includes('behavior') ? 'behavioral' : val.includes('design') ? 'mixed' : 'technical';
                navigate('/mock-interview', { state: { interviewType } });
              }}
            >
              Start
            </button>
          </div>
        ))}
      </div>

      <div className="rubric-card">
        <h2>Scoring Rubric</h2>
        <div className="rubric-grid">
          {rubric.map((r) => (
            <div key={r.area} className="rubric-item">
              <div className="rubric-top">
                <h4>{r.area}</h4>
                <span className="pill ghost">{r.weight}</span>
              </div>
              <p>{r.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
