import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Contests.css';

const upcoming = [
  { name: 'Weekly Sprint #12', date: 'Sunday', duration: '90 min', slots: 'Open', level: 'Mixed' },
  { name: 'DSA Speedrun #5', date: 'Wednesday', duration: '60 min', slots: 'Open', level: 'Easy/Medium' }
];

const virtuals = [
  { name: 'Sprint #10 (Virtual)', problems: 4, editorial: true, ratingDelta: '-15..+40' },
  { name: 'Sprint #9 (Virtual)', problems: 4, editorial: true, ratingDelta: '-10..+35' }
];

const leaderboard = [
  { rank: 1, user: 'Riya', score: 400, time: '38:22' },
  { rank: 2, user: 'Arjun', score: 380, time: '42:05' },
  { rank: 3, user: 'Sam', score: 360, time: '44:11' },
  { rank: 4, user: 'Anita', score: 340, time: '47:00' }
];

export default function Contests() {
  const navigate = useNavigate();

  const goToContest = ({ category = 'dsa', searchTerm = '' }) => {
    navigate('/interview', { state: { category, searchTerm } });
  };

  return (
    <div className="contests-page">
      <div className="contest-hero">
        <div>
          <p className="kicker">Timed Rounds · Standings · Editorials</p>
          <h1>Compete weekly and track your progress</h1>
          <p className="sub">Join the next sprint or run a virtual contest anytime.</p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => goToContest({ searchTerm: 'weekly sprint' })}>
              Join next sprint
            </button>
            <button className="btn ghost" onClick={() => goToContest({ searchTerm: 'virtual contest' })}>
              Start a virtual
            </button>
          </div>
        </div>
        <div className="hero-card">
          <h3>Next contest starts in</h3>
          <div className="countdown">00:42:18</div>
          <p>Remember: no plagiarism, cameras optional, standings live.</p>
        </div>
      </div>

      <section className="contest-section">
        <div className="section-head">
          <h2>Upcoming</h2>
          <p>Register early; reminders 10 minutes before start.</p>
        </div>
        <div className="cards-grid">
          {upcoming.map((c) => (
            <div key={c.name} className="contest-card">
              <h3>{c.name}</h3>
              <p className="meta">{c.date} · {c.duration}</p>
              <p className="pill">{c.level}</p>
              <button className="btn small primary" onClick={() => goToContest({ searchTerm: c.name })}>
                Register
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="contest-section">
        <div className="section-head">
          <h2>Virtual Contests</h2>
          <p>Practice past rounds with standings frozen to you.</p>
        </div>
        <div className="cards-grid">
          {virtuals.map((v) => (
            <div key={v.name} className="contest-card">
              <h3>{v.name}</h3>
              <p className="meta">{v.problems} problems · Editorials {v.editorial ? 'available' : 'N/A'}</p>
              <p className="pill ghost">Rating: {v.ratingDelta}</p>
              <button className="btn small ghost" onClick={() => goToContest({ searchTerm: v.name })}>
                Start virtual
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="contest-section">
        <div className="section-head">
          <h2>Live Standings (sample)</h2>
        </div>
        <div className="table-wrap">
          <table className="leader-table">
            <thead>
              <tr>
                <th>Rank</th><th>User</th><th>Score</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={row.rank}>
                  <td>{row.rank}</td>
                  <td>{row.user}</td>
                  <td>{row.score}</td>
                  <td>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
