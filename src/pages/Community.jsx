import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Community.css';
import axios from '../services/apiClient';

const reviews = [
  {
    user: 'Neha',
    problem: 'Minimum Window Substring',
    summary: 'Great explanation on why shrinking works; added edge-case notes.',
    votes: 24
  },
  {
    user: 'Vikram',
    problem: 'Binary Tree Max Path Sum',
    summary: 'Clear DFS intuition + complexity; shows overflow pitfalls.',
    votes: 18
  }
];

const rooms = [
  { name: 'DSA Sprint (30m)', people: 3, goal: 'Solve 1 medium together' },
  { name: 'System Design Jam', people: 4, goal: 'Design Pastebin in 45m' }
];

export default function Community() {
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoadingNotes(true);
        const res = await axios.get('/api/community/notes');
        if (res?.success) {
          setNotes(res.notes || []);
        }
      } catch (err) {
        console.error('Failed to load notes', err);
      } finally {
        setLoadingNotes(false);
      }
    };
    fetchNotes();
  }, []);

  const handlePost = async () => {
    if (!note.trim()) return;
    try {
      const res = await axios.post('/api/community/notes', { text: note.trim(), user: 'You' });
      if (res?.success) {
        setNotes((prev) => [res.note, ...(prev || [])]);
        setNote('');
      }
    } catch (err) {
      console.error('Failed to post note', err);
      alert('Failed to post note');
    }
  };

  return (
    <div className="comm-page">
      <div className="comm-hero">
        <div>
          <p className="kicker">Peer Review · Study Rooms · Notes</p>
          <h1>Collaborate and learn faster together</h1>
          <p className="sub">Share solutions for review, join live study rooms, and add micro-notes to editorials.</p>
          <div className="actions">
            <button className="btn primary" onClick={() => navigate('/interview', { state: { category: 'all' } })}>
              Share a solution
            </button>
            <button className="btn ghost" onClick={() => navigate('/mock-rounds')}>
              Join a room
            </button>
          </div>
        </div>
      </div>

      <section className="comm-section">
        <div className="head">
          <h2>Peer Reviews</h2>
          <p>Submit your solution; get feedback and upvotes.</p>
        </div>
        <div className="comm-grid">
          {reviews.map((r) => (
            <div key={r.user + r.problem} className="comm-card">
              <div className="card-head">
                <h3>{r.problem}</h3>
                <span className="pill">{r.votes} upvotes</span>
              </div>
              <p className="meta">by {r.user}</p>
              <p>{r.summary}</p>
              <button className="btn small ghost" onClick={() => navigate('/interview')}>
                View thread
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="comm-section">
        <div className="head">
          <h2>Study Rooms</h2>
          <p>Timed sessions with shared timer and mini-leaderboard.</p>
        </div>
        <div className="comm-grid">
          {rooms.map((r) => (
            <div key={r.name} className="comm-card">
              <div className="card-head">
                <h3>{r.name}</h3>
                <span className="pill ghost">{r.people} joined</span>
              </div>
              <p>{r.goal}</p>
              <button className="btn small primary" onClick={() => navigate('/mock-rounds', { state: { room: r.name } })}>
                Join
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="comm-section">
        <div className="head">
          <h2>Editorial Notes</h2>
          <p>Add “why this works” micro-notes on editorials.</p>
        </div>
        <div className="notes-list">
          {loadingNotes ? (
            <p className="meta">Loading notes...</p>
          ) : notes.length ? (
            notes.map((n) => (
              <div key={n.id} className="note-item">
                <div className="note-top">
                  <span className="note-user">{n.user}</span>
                  <span className="note-time">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p>{n.text}</p>
              </div>
            ))
          ) : (
            <p className="meta">No notes yet. Be the first to add one.</p>
          )}
        </div>
        <div className="notes-box">
          <textarea
            placeholder="Add your micro-note (pitfall, invariant, or alternate approach)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="notes-actions">
            <button className="btn ghost small" onClick={() => setNote('')}>Cancel</button>
            <button className="btn primary small" onClick={handlePost}>Post note</button>
          </div>
        </div>
      </section>
    </div>
  );
}
