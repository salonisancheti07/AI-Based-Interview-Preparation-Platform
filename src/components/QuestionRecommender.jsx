import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import '../styles/QuestionRecommender.css';
import { questionsDatabase } from '../data/questions';

const styles = [
  { id: 'formal', name: 'Formal', description: 'Structured interview prompts' },
  { id: 'casual', name: 'Casual', description: 'Conversational prompts' },
  { id: 'technical', name: 'Technical', description: 'Core technical prompts' },
  { id: 'adaptive', name: 'Adaptive', description: 'Mix of types based on need' }
];

const getPayload = (response) => (response && typeof response === 'object' && 'data' in response ? response.data : response);

export default function QuestionRecommender() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('formal');
  const [level, setLevel] = useState('medium');
  const [focus, setFocus] = useState('ml');
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newOnly, setNewOnly] = useState(false);
  const [behavioralMix, setBehavioralMix] = useState(0);
  const [category, setCategory] = useState('all');
  const SEEN_KEY = 'recommenderSeen';

  const localQuestions = useMemo(() => {
    const all = [];
    Object.entries(questionsDatabase).forEach(([category, qs]) => {
      qs.forEach((q) => all.push({ ...q, category, topic: q.title?.split(' ')?.slice(0, 3).join(' ') }));
    });
    return all;
  }, []);

  const inferCategory = (focusTerm) => {
    const f = (focusTerm || '').toLowerCase();
    if (f.match(/\b(ml|machine learning|transformer|cnn|rnn|bert|gpt|vision|nlp)\b/)) return 'Machine Learning';
    if (f.match(/\b(sql|database|dbms|joins)\b/)) return 'SQL';
    if (f.match(/\b(system design|scalability|microservice|cache)\b/)) return 'System Design';
    if (f.match(/\b(graph|tree|array|dp|algo)\b/)) return 'Data Structures & Algorithms';
    return 'all';
  };

  const tokenize = (text = '') =>
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);

  const buildLocalRecommendations = (focusTerm, targetLevel, style, catFilter) => {
    const focusTokens = tokenize(focusTerm || '');
    const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));

    const scored = localQuestions.map((q) => {
      if (catFilter && catFilter !== 'all' && q.category?.toLowerCase() !== catFilter.toLowerCase()) return null;
      const titleTokens = tokenize(q.title).concat(tokenize(q.description || ''));
      const overlap = focusTokens.reduce((acc, t) => acc + (titleTokens.includes(t) ? 1 : 0), 0);
      const difficultyMatch = q.difficulty?.toLowerCase() === targetLevel ? 2 : 0;
      const successScore = Math.min(2, Math.round((q.successRate || 70) / 35));
      const attemptsScore = Math.min(2, Math.round((q.attempts || 0) / 15));
      const behavioralBoost = style === 'adaptive' && q.category?.toLowerCase().includes('behavior') ? 2 : 0;
      const score = overlap * 2 + difficultyMatch + successScore + attemptsScore + behavioralBoost;
      return { q, score };
    }).filter(Boolean);

    return scored
      .sort((a, b) => b.score - a.score)
      .map(({ q, score }, idx) => ({
        id: q.id || `local-${idx}`,
        question: q.title,
        difficulty: q.difficulty || 'Medium',
        category: q.category || 'General',
        topic: q.topic || focusTerm || 'General',
        confidence: `${Math.min(95, 60 + score * 4)}%`,
        reason: `Matched focus + ${q.difficulty || 'Medium'} difficulty; popularity score ${score}`
      }))
      .filter((item) => (newOnly ? !seen.has(item.id || item.question) : true))
      .slice(0, 12);
  };

  const fetchRecommendations = async (style, selectedLevel, selectedFocus, selectedCategory) => {
    setLoading(true);
    try {
      const resolvedCategory = selectedCategory === 'all' ? inferCategory(selectedFocus) : selectedCategory;
      const query = new URLSearchParams({
        style,
        level: selectedLevel,
        ...(resolvedCategory && resolvedCategory !== 'all' ? { category: resolvedCategory } : {}),
        ...(selectedFocus.trim() ? { focus: selectedFocus.trim() } : {}),
        behavioral: behavioralMix
      }).toString();
      const response = await axios.get(`/api/question-recommender/suggestions?${query}`);
      const payload = getPayload(response) || {};
      let recs = payload.data || [];

      // behavioral mix: append behavioral hint to improve relevance client-side when backend lacks signal
      if (behavioralMix > 0) {
        const boost = Math.max(1, Math.round((behavioralMix / 25)));
        recs = recs.flatMap((r) => (r.category === 'Behavioral' ? [r] : Array(boost).fill(r))).slice(0, 12);
      }

      if (newOnly) {
        const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
        recs = recs.filter((r) => !seen.has(r.id || r.question));
      }

      // If backend returned nothing, fall back to local ML-ish ranking
      const filterByCategory = (items) =>
        resolvedCategory === 'all'
          ? items
          : items.filter((r) => (r.category || '').toLowerCase() === resolvedCategory.toLowerCase());

      const filterByLevel = (items) =>
        items.filter((r) => !r.difficulty || r.difficulty.toLowerCase() === selectedLevel);

      if (!Array.isArray(recs) || recs.length === 0) {
        recs = buildLocalRecommendations(selectedFocus, selectedLevel, style, resolvedCategory);
      } else {
        recs = filterByCategory(recs);
        recs = filterByLevel(recs);
        // Re-rank backend results by simple keyword/difficulty match for quality
        const focusTokens = tokenize(selectedFocus || '');
        recs = recs
          .map((r, idx) => {
            const titleTokens = tokenize(r.question || '');
            const overlap = focusTokens.reduce((acc, t) => acc + (titleTokens.includes(t) ? 1 : 0), 0);
            const difficultyMatch = (r.difficulty || '').toLowerCase() === selectedLevel ? 1 : 0;
            return { r, score: overlap * 2 + difficultyMatch + (r.confidence ? parseInt(r.confidence) / 50 : 0), idx };
          })
          .sort((a, b) => b.score - a.score || a.idx - b.idx)
          .map(({ r }) => r);
      }

      if (!recs || recs.length === 0) {
        recs = buildLocalRecommendations(selectedFocus, selectedLevel, style, resolvedCategory);
      }

      setRecommendations(recs);
      setMeta(payload.meta || null);
      setError('');

      // persist seen if newOnly is on
      const seenSet = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
      recs.forEach((r) => seenSet.add(r.id || r.question));
      localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seenSet).slice(-300)));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      const recs = buildLocalRecommendations(selectedFocus, selectedLevel, style, resolvedCategory);
      setRecommendations(recs);
      setMeta({ style, level: selectedLevel, focus: selectedFocus || 'general', category: resolvedCategory, total: recs.length });
      setError('Could not reach recommender service. Using local ranked suggestions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(selectedStyle, level, focus, category);
  }, [selectedStyle, level, category]);

  return (
    <div className="question-recommender-container">
      <div className="recommender-header">
        <h1>Question Recommender</h1>
        <p>Get tailored question suggestions based on interview style.</p>
        {error && <p className="error-banner">{error}</p>}
      </div>
      <div className="recommendation-main">
        <div className="style-selector">
          <h3>Choose Style</h3>
          <div className="styles-grid">
            {styles.map((style) => (
              <button key={style.id} className={`style-card ${selectedStyle === style.id ? 'active' : ''}`} onClick={() => setSelectedStyle(style.id)}>
                <span className="style-name">{style.name}</span>
                <span className="style-desc">{style.description}</span>
              </button>
            ))}
          </div>
          <div className="recommender-filters">
            <label>
              Level
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="rec-filter-select">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rec-filter-select">
                <option value="all">All</option>
                {Object.keys(questionsDatabase).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <label>
              Focus (optional)
              <input
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="ml, transformers, arrays, system design..."
                className="rec-filter-input"
              />
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
              <span>Show new questions only</span>
            </label>
            <label className="slider-row">
              <span>Behavioral mix: {behavioralMix}%</span>
              <input
                type="range"
                min="0"
                max="60"
                step="10"
                value={behavioralMix}
                onChange={(e) => setBehavioralMix(Number(e.target.value))}
              />
            </label>
            <button className="btn-practice-rec" onClick={() => fetchRecommendations(selectedStyle, level, focus, category)}>
              Refresh
            </button>
          </div>
          <div className="chip-row">
            {['ml', 'transformers', 'cnn', 'probability', 'graphs', 'behavioral'].map((tag) => (
              <button key={tag} className={`chip ${focus === tag ? 'active' : ''}`} onClick={() => setFocus(tag)}>
                {tag}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="loading">Loading recommendations...</div>
        ) : (
            <div className="recommendations-section">
            <h3>Recommended Questions ({recommendations.length})</h3>
            {meta && (
              <p className="rec-meta">
                Mode: {meta.style} | Level: {meta.level} | Focus: {meta.focus} | Category: {meta.category || category}
              </p>
            )}
            <div className="recommendations-list">
              {recommendations.length === 0 && <p className="empty-state">No matches. Try a different focus or level.</p>}
              {recommendations.map((item, index) => (
                <div key={item.id || index} className="recommendation-card">
                  <div className="rec-header">
                    <h4>Q{index + 1}: {item.question}</h4>
                    <div className="rec-badges">
                      <span className="difficulty-badge">{item.difficulty || 'Medium'}</span>
                    </div>
                  </div>
                  <div className="rec-info">
                    <p><strong>Style:</strong> {item.style || selectedStyle}</p>
                    <p><strong>Category:</strong> {item.category || selectedStyle}</p>
                    <p><strong>Topic:</strong> {item.topic || 'General'}</p>
                    <p><strong>Confidence:</strong> {item.confidence || '70%'}</p>
                    <p><strong>Reason:</strong> {item.reason || 'Balanced recommendation based on your selected style.'}</p>
                  </div>
                  <button
                    className="btn-practice-rec"
                    onClick={() => navigate('/interview', { state: { category: 'all', searchTerm: item.question } })}
                  >
                    Practice This
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
