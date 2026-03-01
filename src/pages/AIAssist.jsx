import React, { useState } from 'react';
import '../styles/AIAssist.css';
import axios from '../services/apiClient';

export default function AIAssist() {
  const [code, setCode] = useState('');
  const [question, setQuestion] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const runCritique = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setFeedback('Analyzing your code...');
    try {
      const res = await axios.post('/api/ai/assist/critique', { code });
      const fb = res?.feedback || res?.data?.feedback;
      setFeedback(fb || 'No feedback returned. Ensure backend is running.');
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to get critique.');
    } finally {
      setLoading(false);
    }
  };

  const runBehavioral = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setFeedback('Scoring your answer...');
    try {
      const res = await axios.post('/api/ai/assist/behavioral', { answer: question });
      const fb = res?.feedback || res?.data?.feedback;
      setFeedback(fb || 'No feedback returned. Ensure backend is running.');
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to grade answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aiassist-page">
      <div className="aiassist-hero">
        <div>
          <p className="kicker">AI Critique · Complexity Check · Behavioral Grader</p>
          <h1>AI boosts for faster improvement</h1>
          <p className="sub">Get code critique, estimated complexity, and graded interview answers.</p>
        </div>
      </div>

      <div className="aiassist-grid">
        <div className="ai-card">
          <div className="card-head">
            <h3>Code Critique</h3>
            <span className="pill">DS/Algo</span>
          </div>
          <textarea
            placeholder="Paste your solution code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="card-actions">
            <button className="btn primary" onClick={runCritique} disabled={loading}>Critique</button>
            <button className="btn ghost" onClick={() => setCode('')}>Clear</button>
          </div>
        </div>

        <div className="ai-card">
          <div className="card-head">
            <h3>Behavioral Grader (STAR)</h3>
            <span className="pill ghost">HR</span>
          </div>
          <textarea
            placeholder="Paste your STAR answer..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="card-actions">
            <button className="btn primary" onClick={runBehavioral} disabled={loading}>Grade</button>
            <button className="btn ghost" onClick={() => setQuestion('')}>Clear</button>
          </div>
        </div>

        <div className="ai-card result">
          <div className="card-head">
            <h3>Feedback</h3>
            <span className="pill">AI</span>
          </div>
          <div className="feedback-box">
            {feedback ? feedback : 'Run a critique or grader to see feedback here.'}
          </div>
        </div>
      </div>
    </div>
  );
}
