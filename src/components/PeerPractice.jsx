import React, { useEffect, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/PeerPractice.css';

const getPayload = (response) => (response && typeof response === 'object' && 'data' in response ? response.data : response);

const normalizeSession = (raw = {}, index = 0) => ({
  _id: raw.id || `s-${index}`,
  title: raw.title || `${raw.topic || 'Interview'} Session`,
  topic: raw.topic || 'General',
  participants: Array.isArray(raw.participants)
    ? raw.participants
    : new Array(Number(raw.participants) || 1).fill(null).map((_, i) => ({ username: `User ${i + 1}`, role: i === 0 ? 'candidate' : 'interviewer' })),
  status: raw.status || 'scheduled',
  scheduledTime: raw.scheduledTime || raw.created || new Date().toISOString()
});

const demoSessions = [
  { id: 'demo-1', title: 'DSA Warmup', topic: 'Arrays', participants: [{ username: 'Alex', role: 'candidate' }], status: 'scheduled' },
  { id: 'demo-2', title: 'System Design Prep', topic: 'Caching', participants: [{ username: 'Priya', role: 'interviewer' }], status: 'scheduled' }
].map(normalizeSession);

export default function PeerPractice() {
  const [sessions, setSessions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('candidate');
  const [error, setError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/peer-practice');
        const payload = getPayload(response) || [];
        setSessions(payload.map(normalizeSession));
        setError('');
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setSessions(demoSessions);
        setError('Live sessions unavailable; showing demo sessions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const handleCreateSession = async (sessionData) => {
    try {
      const response = await axios.post('/api/peer-practice/create', {
        topic: sessionData.topic || sessionData.title || 'General',
        difficulty: sessionData.difficulty || 'Medium'
      });
      const payload = getPayload(response);
      if (payload) {
        setSessions((prev) => [normalizeSession(payload, prev.length), ...prev]);
      }
      setShowCreateForm(false);
    } catch (err) {
      const mock = normalizeSession(
        {
          id: `local-${Date.now()}`,
          title: sessionData.title || sessionData.topic || 'Peer Session',
          topic: sessionData.topic,
          participants: [{ username: 'You', role: myRole }],
          status: 'scheduled'
        },
        sessions.length
      );
      setSessions((prev) => [mock, ...prev]);
      setShowCreateForm(false);
      setError('Backend offline, added a local demo session.');
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      const response = await axios.post(`/api/peer-practice/${sessionId}/join`, { role: myRole });
      const payload = getPayload(response);
      const updated = normalizeSession(payload?.data || payload);
      setSessions((prev) => prev.map((s) => (s._id === sessionId ? updated : s)));
      alert('Joined session');
    } catch (err) {
      setSessions((prev) =>
        prev.map((s) =>
          s._id === sessionId
            ? {
                ...s,
                participants: [...(s.participants || []), { username: 'You', role: myRole }],
                status: s.participants.length + 1 >= 2 ? 'In Progress' : s.status
              }
            : s
        )
      );
      setError('Joined locally (backend offline).');
    }
  };

  const handleCreateInstantRoom = () => {
    const code = Math.random().toString(36).slice(2, 7).toUpperCase();
    setRoomCode(code);
    setTimer(0);
    setTimerRunning(false);
    alert(`Room created: ${code}`);
  };

  const handleJoinInstantRoom = () => {
    if (!roomCode) {
      alert('Enter a room code to join.');
      return;
    }
    alert(`Joined room ${roomCode}. Share this code with your peer.`);
  };

  if (loading) return <div className="loading">Loading peer sessions...</div>;

  return (
    <div className="peer-practice-container">
      <div className="pp-header">
        <h1>Peer Practice Sessions</h1>
        <p>Practice interviews with peers and reviewers.</p>
        {error && <p className="error-banner">{error}</p>}
      </div>
      <div className="sessions-view">
        <div className="role-selector">
          <label>My Role:</label>
          <select value={myRole} onChange={(e) => setMyRole(e.target.value)} className="role-select">
            <option value="candidate">Candidate</option>
            <option value="interviewer">Interviewer</option>
            <option value="observer">Observer</option>
          </select>
          <button className="btn-create-session" onClick={() => setShowCreateForm(true)}>Create Session</button>
        </div>
        <div className="sessions-section">
          <h3>Instant Room</h3>
          <div className="sessions-grid">
            <div className="session-card">
              <h4>Create & Share</h4>
              <p>Generate a room code and share it with your peer.</p>
              <button className="btn-join" onClick={handleCreateInstantRoom}>Create Room</button>
              {roomCode && <p className="session-badge">Code: {roomCode}</p>}
            </div>
            <div className="session-card">
              <h4>Join Room</h4>
              <p>Enter a code from your peer to join.</p>
              <input
                className="form-input"
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
              <button className="btn-join" onClick={handleJoinInstantRoom}>Join</button>
              <div style={{ marginTop: '10px' }}>
                <strong>Shared Timer</strong>
                <div className="session-badge">{String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button className="btn-register" onClick={() => { setTimer(0); setTimerRunning(false); }}>Reset</button>
                  <button className="btn-review" onClick={() => setTimerRunning((v) => !v)}>{timerRunning ? 'Pause' : 'Start'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showCreateForm && <CreateSessionForm onSubmit={handleCreateSession} onCancel={() => setShowCreateForm(false)} />}
        <div className="sessions-section">
          <h3>Available Sessions ({sessions.length})</h3>
          <div className="sessions-grid">
            {sessions.map((session) => (
              <div key={session._id} className="session-card">
                <h4>{session.title}</h4>
                <p>Topic: {session.topic}</p>
                <p>Participants: {session.participants.length}</p>
                <p>Status: {session.status}</p>
                <button className="btn-join" onClick={() => handleJoinSession(session._id)}>Join</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateSessionForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ title: '', topic: 'Machine Learning', difficulty: 'Medium' });
  return (
    <div className="create-session-modal">
      <div className="modal-content">
        <h3>Create New Session</h3>
        <input className="form-input" placeholder="Session title" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} />
        <input className="form-input" placeholder="Topic" value={formData.topic} onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))} />
        <select className="form-input" value={formData.difficulty} onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value }))}>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <div className="modal-actions">
          <button className="btn-create" onClick={() => onSubmit(formData)}>Create</button>
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
