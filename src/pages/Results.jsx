import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Results.css';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shareOpen, setShareOpen] = useState(false);

  const result = location.state || {
    score: 3,
    total: 4,
    accuracy: 75,
    timeTaken: 12,
    category: 'JavaScript',
    questionsDetails: [
      { id: 1, question: 'Event Loop', answer: 'Correct', time: 2 },
      { id: 2, question: 'Virtual DOM', answer: 'Correct', time: 3 },
      { id: 3, question: 'Debounce', answer: 'Incorrect', time: 5 },
      { id: 4, question: 'URL Shortener', answer: 'Correct', time: 2 }
    ]
  };

  const accuracy = Math.round((result.score / result.total) * 100);
  const performanceLevel = accuracy >= 80 ? 'Excellent' : accuracy >= 60 ? 'Good' : 'Need Practice';
  const performanceColor = accuracy >= 80 ? '#10b981' : accuracy >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Quiz Results</h1>
      </div>

      {/* Score Card */}
      <div className="score-card">
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: performanceColor }}>
            <div className="score-number">{result.score}/{result.total}</div>
            <div className="score-percentage">{accuracy}%</div>
          </div>
          <div className="score-info">
            <h2>Great Effort! 🎉</h2>
            <p className="performance-level" style={{ color: performanceColor }}>
              {performanceLevel}
            </p>
            <p className="time-taken">Time Taken: {result.timeTaken} minutes</p>
            <p className="category">Category: {result.category}</p>
          </div>
        </div>

        <div className="score-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/interview')}
          >
            Try Another Quiz
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShareOpen(!shareOpen)}
          >
            Share Results
          </button>
        </div>

        {shareOpen && (
          <div className="share-options">
            <button>📱 Share on LinkedIn</button>
            <button>🐦 Share on Twitter</button>
            <button>📋 Copy Result Link</button>
          </div>
        )}
      </div>

      {/* Detailed Results */}
      <div className="detailed-results">
        <h3>Question Breakdown</h3>
        <div className="results-table">
          <div className="table-header">
            <div className="col-number">#</div>
            <div className="col-question">Question</div>
            <div className="col-result">Result</div>
            <div className="col-time">Time</div>
          </div>

          {result.questionsDetails.map((q, index) => (
            <div key={q.id} className="table-row">
              <div className="col-number">{index + 1}</div>
              <div className="col-question">{q.question}</div>
              <div className={`col-result ${q.answer === 'Correct' ? 'correct' : 'incorrect'}`}>
                {q.answer === 'Correct' ? '✓ Correct' : '✗ Incorrect'}
              </div>
              <div className="col-time">{q.time}m</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="performance-analysis">
        <h3>Performance Analysis</h3>
        <div className="analysis-grid">
          <div className="analysis-card">
            <div className="analysis-icon">⏱️</div>
            <div className="analysis-content">
              <div className="analysis-label">Average Time per Question</div>
              <div className="analysis-value">{Math.round(result.timeTaken / result.total)} min</div>
            </div>
          </div>

          <div className="analysis-card">
            <div className="analysis-icon">📊</div>
            <div className="analysis-content">
              <div className="analysis-label">Accuracy</div>
              <div className="analysis-value">{accuracy}%</div>
            </div>
          </div>

          <div className="analysis-card">
            <div className="analysis-icon">🎯</div>
            <div className="analysis-content">
              <div className="analysis-label">Correct Answers</div>
              <div className="analysis-value">{result.score} out of {result.total}</div>
            </div>
          </div>

          <div className="analysis-card">
            <div className="analysis-icon">⚡</div>
            <div className="analysis-content">
              <div className="analysis-label">Total Time</div>
              <div className="analysis-value">{result.timeTaken} minutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations">
        <h3>📝 Recommendations</h3>
        <div className="recommendation-items">
          {accuracy >= 80 ? (
            <>
              <div className="recommendation-item">
                <span className="recommendation-icon">✨</span>
                <div>
                  <h4>Excellent Performance!</h4>
                  <p>You're doing great! Try harder questions to challenge yourself.</p>
                </div>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon">📚</span>
                <div>
                  <h4>Explore New Topics</h4>
                  <p>Expand your knowledge with different interview topics.</p>
                </div>
              </div>
            </>
          ) : accuracy >= 60 ? (
            <>
              <div className="recommendation-item">
                <span className="recommendation-icon">📖</span>
                <div>
                  <h4>Review Concepts</h4>
                  <p>Revisit the topics where you faced challenges.</p>
                </div>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon">🔄</span>
                <div>
                  <h4>Practice More</h4>
                  <p>Attempt similar questions to strengthen your foundation.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="recommendation-item">
                <span className="recommendation-icon">📚</span>
                <div>
                  <h4>Study the Concepts</h4>
                  <p>Go through detailed explanations for the questions you missed.</p>
                </div>
              </div>
              <div className="recommendation-item">
                <span className="recommendation-icon">🎯</span>
                <div>
                  <h4>Practice Easy Questions First</h4>
                  <p>Start with easier questions and gradually increase difficulty.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
