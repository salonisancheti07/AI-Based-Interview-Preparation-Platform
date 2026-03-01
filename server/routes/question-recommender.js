const express = require('express');
const router = express.Router();

const questionBank = [
  { id: 'dsa-1', question: 'Two Sum', category: 'DSA', topic: 'Arrays', difficulty: 'Easy' },
  { id: 'dsa-2', question: 'Longest Substring Without Repeating Characters', category: 'DSA', topic: 'Sliding Window', difficulty: 'Medium' },
  { id: 'dsa-3', question: 'Merge K Sorted Lists', category: 'DSA', topic: 'Heaps', difficulty: 'Hard' },
  { id: 'dsa-4', question: 'Binary Tree Level Order Traversal', category: 'DSA', topic: 'Trees', difficulty: 'Medium' },
  { id: 'dsa-5', question: 'LRU Cache', category: 'DSA', topic: 'Design', difficulty: 'Hard' },
  { id: 'system-1', question: 'Design URL Shortener', category: 'System Design', topic: 'Scalability', difficulty: 'Medium' },
  { id: 'system-2', question: 'Design Notification Service', category: 'System Design', topic: 'Messaging', difficulty: 'Medium' },
  { id: 'system-3', question: 'Design Ride Sharing Backend', category: 'System Design', topic: 'Distributed Systems', difficulty: 'Hard' },
  { id: 'ml-1', question: 'Explain bias-variance tradeoff with examples', category: 'Machine Learning', topic: 'Generalization', difficulty: 'Medium' },
  { id: 'ml-2', question: 'How does gradient descent work and what affects convergence?', category: 'Machine Learning', topic: 'Optimization', difficulty: 'Medium' },
  { id: 'ml-3', question: 'Regularization techniques for overfitting in neural nets', category: 'Machine Learning', topic: 'Regularization', difficulty: 'Hard' },
  { id: 'ml-4', question: 'Compare RNNs, CNNs, and Transformers', category: 'Machine Learning', topic: 'Architectures', difficulty: 'Hard' },
  { id: 'ml-5', question: 'Evaluate a binary classifier without balanced data', category: 'Machine Learning', topic: 'Evaluation', difficulty: 'Medium' },
  { id: 'behavioral-1', question: 'Tell me about a time you handled conflict', category: 'Behavioral', topic: 'STAR', difficulty: 'Easy' },
  { id: 'behavioral-2', question: 'Describe a failure and what you learned', category: 'Behavioral', topic: 'Growth Mindset', difficulty: 'Easy' },
  { id: 'behavioral-3', question: 'How do you prioritize under pressure?', category: 'Behavioral', topic: 'Prioritization', difficulty: 'Medium' },
  { id: 'apt-1', question: 'Profit and Loss word problems', category: 'Aptitude', topic: 'Arithmetic', difficulty: 'Easy' },
  { id: 'apt-2', question: 'Time and Work mixed concepts', category: 'Aptitude', topic: 'Arithmetic', difficulty: 'Medium' },
  { id: 'apt-3', question: 'Probability and Combinations', category: 'Aptitude', topic: 'Probability', difficulty: 'Hard' }
];

const styleCategoryWeights = {
  formal: ['Behavioral', 'System Design', 'DSA', 'Machine Learning'],
  casual: ['Behavioral', 'Aptitude', 'DSA', 'Machine Learning'],
  technical: ['DSA', 'System Design', 'Machine Learning', 'Aptitude'],
  adaptive: ['DSA', 'Aptitude', 'System Design', 'Behavioral', 'Machine Learning']
};

// -------- Lightweight embedding + similarity (no extra deps) --------
const toTokens = (text) =>
  (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

function buildVector(tokens) {
  const vec = {};
  tokens.forEach((t) => {
    vec[t] = (vec[t] || 0) + 1;
  });
  // L2 normalize
  const norm = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
  Object.keys(vec).forEach((k) => (vec[k] = vec[k] / norm));
  return vec;
}

function cosineSim(a, b) {
  let sum = 0;
  const [shorter, longer] = Object.keys(a).length < Object.keys(b).length ? [a, b] : [b, a];
  for (const k of Object.keys(shorter)) {
    if (longer[k]) sum += shorter[k] * longer[k];
  }
  return sum;
}

// Precompute embeddings for the question bank
const questionVectors = questionBank.map((q) => {
  const tokens = toTokens(`${q.question} ${q.topic} ${q.category} ${q.difficulty}`);
  return buildVector(tokens);
});

router.get('/suggestions', async (req, res) => {
  try {
    const style = (req.query.style || 'formal').toLowerCase();
    const level = (req.query.level || 'medium').toLowerCase();
    const focus = (req.query.focus || '').toLowerCase();

    const preferredCategories = styleCategoryWeights[style] || styleCategoryWeights.formal;
    const levelDifficulty = level === 'easy' ? ['Easy'] : level === 'hard' ? ['Hard', 'Medium'] : ['Medium', 'Easy', 'Hard'];

    // Level filter first
    let pool = questionBank
      .map((q, idx) => ({ ...q, _vecIndex: idx }))
      .filter((question) => levelDifficulty.includes(question.difficulty));

    // Vector similarity using focus/style as query
    const queryTokens = toTokens(`${focus || ''} ${style} ${level} ${preferredCategories.join(' ')}`);
    const queryVec = buildVector(queryTokens.length ? queryTokens : ['general']);

    pool = pool
      .map((question) => {
        const vec = questionVectors[question._vecIndex];
        const similarity = cosineSim(queryVec, vec);
        const categoryBoost = preferredCategories.indexOf(question.category);
        const boost = categoryBoost === -1 ? 0.85 : 1.05 - categoryBoost * 0.05;
        return { ...question, score: similarity * boost };
      })
      .sort((a, b) => b.score - a.score);

    const suggestions = pool.slice(0, 8).map((item, index) => ({
      id: item.id,
      question: item.question,
      style,
      difficulty: item.difficulty,
      category: item.category,
      topic: item.topic,
      confidence: `${Math.max(60, 92 - index * 4)}%`,
      reason: `Recommended for ${style} prep based on ${item.category} and ${item.topic}.`
    }));

    res.json({
      success: true,
      data: suggestions,
      meta: {
        style,
        level,
        focus: focus || 'general',
        total: suggestions.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
