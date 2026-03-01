import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestionsByCategory } from '../data/questions';
import '../styles/Aptitude.css';

const TOPIC_META = [
  { title: 'Quantitative', focus: 'Ratios, Percentages, Time & Work' },
  { title: 'Logical Reasoning', focus: 'Arrangements, Puzzles, Syllogisms' },
  { title: 'Verbal Ability', focus: 'RC, Para Jumbles, Sentence Correction' },
  { title: 'CS Fundamentals', focus: 'DBMS, OS, Networks, OOP' }
];

const drills = [
  { name: 'Speed Math', duration: '10 min', questions: 15, category: 'Quantitative' },
  { name: 'Logic Mini', duration: '12 min', questions: 12, category: 'Logical Reasoning' },
  { name: 'Verbal Sprint', duration: '10 min', questions: 10, category: 'Verbal Ability' }
];

export default function Aptitude() {
  const navigate = useNavigate();
  const topics = useMemo(
    () =>
      TOPIC_META.map((t) => ({
        ...t,
        items: getQuestionsByCategory(t.title).length
      })),
    []
  );

  const goPractice = ({ category = 'all', searchTerm = '' }) => {
    navigate('/interview', { state: { category, searchTerm } });
  };

  return (
    <div className="apt-page">
      <div className="apt-hero">
        <div>
          <p className="kicker">Aptitude | Verbal | CS Fundamentals</p>
          <h1>Quick aptitude drills for placement prep</h1>
          <p className="sub">Timed sets with instant explanations and difficulty ramps.</p>
          <div className="actions">
            <button className="btn primary" onClick={() => goPractice({ category: 'all' })}>
              Start 10-min drill
            </button>
            <button className="btn ghost" onClick={() => goPractice({ category: 'all' })}>
              View question bank
            </button>
          </div>
        </div>
      </div>

      <section className="apt-section">
        <div className="head">
          <h2>Topic Banks</h2>
          <p>Practice like IndiaBIX - concise statements, options, solutions.</p>
        </div>
        <div className="apt-grid">
          {topics.map((t) => (
            <div key={t.title} className="apt-card">
              <h3>{t.title}</h3>
              <p className="meta">{t.items} questions</p>
              <p>{t.focus}</p>
              <button className="btn small primary" onClick={() => goPractice({ category: t.title })}>
                Practice
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="apt-section">
        <div className="head">
          <h2>Timed Drills</h2>
          <p>Short bursts with accuracy + speed score.</p>
        </div>
        <div className="apt-grid drills">
          {drills.map((d) => (
            <div key={d.name} className="apt-card">
              <h3>{d.name}</h3>
              <p className="meta">{d.duration}</p>
              <p>{d.questions} questions</p>
              <button className="btn small ghost" onClick={() => goPractice({ category: d.category })}>
                Start
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
