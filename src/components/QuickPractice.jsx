import React, { useState, useEffect } from 'react';
import '../styles/QuickPractice.css';

const QuickPractice = () => {
  const [sessionMode, setSessionMode] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [sessionResults, setSessionResults] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [settings, setSettings] = useState({
    category: 'All',
    difficulty: 'Any',
    questionCount: 8,
    mode: 'mcq' // mcq | flash
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const questionBank = [
    {
      id: 1,
      question: 'What is the time complexity of Binary Search?',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      correct: 1,
      category: 'DSA',
      difficulty: 'Easy',
      tip: 'Each comparison halves the search space.'
    },
    {
      id: 2,
      question: 'What does REST stand for?',
      options: ['Representational State Transfer', 'Resource Exchange System Transfer', 'Retrieve External State Transfer', 'Response Exchange State Transfer'],
      correct: 0,
      category: 'Web',
      difficulty: 'Easy',
      tip: 'Architectural style, not a protocol.'
    },
    {
      id: 3,
      question: 'Which data structure uses LIFO principle?',
      options: ['Queue', 'Stack', 'Array', 'LinkedList'],
      correct: 1,
      category: 'DSA',
      difficulty: 'Easy',
      tip: 'Think of plates stacked in a cafeteria.'
    },
    {
      id: 4,
      question: 'What is React?',
      options: ['A CSS framework', 'A JavaScript library for building UIs', 'A backend framework', 'A database'],
      correct: 1,
      category: 'Frontend',
      difficulty: 'Easy',
      tip: 'It is declarative and component-based.'
    },
    {
      id: 5,
      question: 'Explain the concept of closure in JavaScript',
      options: ['Closing browser window', 'Function accessing outer scope variables', 'CSS property', 'Database connection'],
      correct: 1,
      category: 'JavaScript',
      difficulty: 'Medium',
      tip: 'Created when an inner function remembers variables from outer scope.'
    },
    {
      id: 6,
      question: 'What is a primary benefit of TypeScript?',
      options: ['Runtime performance', 'Static type safety', 'Smaller bundle size', 'Built-in UI components'],
      correct: 1,
      category: 'Frontend',
      difficulty: 'Medium',
      tip: 'Catches errors before the code runs.'
    },
    {
      id: 7,
      question: 'Which consistency model does MongoDB default to?',
      options: ['Strong consistency', 'Eventual consistency', 'Causal consistency', 'Monotonic reads only'],
      correct: 1,
      category: 'Backend',
      difficulty: 'Medium',
      tip: 'Depends on replica set acknowledgment.'
    },
    {
      id: 8,
      question: 'In system design, what problem does a circuit breaker solve?',
      options: ['Traffic routing', 'Cascading failures', 'Authentication', 'Compression'],
      correct: 1,
      category: 'System Design',
      difficulty: 'Hard',
      tip: 'Prevents overloading a failing downstream service.'
    },
    {
      id: 9,
      question: 'What is the space complexity of DFS using recursion on a tree of height h?',
      options: ['O(1)', 'O(log n)', 'O(h)', 'O(n)'],
      correct: 2,
      category: 'DSA',
      difficulty: 'Medium',
      tip: 'Call stack depth follows tree height.'
    },
    {
      id: 10,
      question: 'Which HTTP code best represents “Too Many Requests”?',
      options: ['401', '404', '409', '429'],
      correct: 3,
      category: 'Web',
      difficulty: 'Easy',
      tip: 'Used for rate limiting responses.'
    },
    {
      id: 11,
      question: 'What is idempotency in APIs?',
      options: ['Same response time', 'Multiple identical requests have same effect', 'Always cached', 'Cannot be retried'],
      correct: 1,
      category: 'Backend',
      difficulty: 'Medium',
      tip: 'PUT should be idempotent.'
    },
    {
      id: 12,
      question: 'Which algorithm is stable by default?',
      options: ['Quick Sort', 'Merge Sort', 'Heap Sort', 'Selection Sort'],
      correct: 1,
      category: 'DSA',
      difficulty: 'Hard',
      tip: 'Divide and conquer while preserving order of equals.'
    }
  ];

  const modes = [
    { duration: 5, label: '⚡ 5 Min', icon: '⚡', color: '#ff6b6b' },
    { duration: 10, label: '🔥 10 Min', icon: '🔥', color: '#ffd93d' },
    { duration: 15, label: '💪 15 Min', icon: '💪', color: '#6bcf7f' },
    { duration: 30, label: '🚀 30 Min', icon: '🚀', color: '#4d96ff' }
  ];

  useEffect(() => {
    if (sessionActive && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleEndSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionActive, timeRemaining]);

  const difficultyScore = (level) => {
    if (level === 'Hard') return 20;
    if (level === 'Medium') return 15;
    return 10;
  };

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const startSession = (duration) => {
    const filteredPool = questionBank.filter((q) => {
      const categoryMatch = settings.category === 'All' || q.category === settings.category;
      const difficultyMatch = settings.difficulty === 'Any' || q.difficulty === settings.difficulty;
      return categoryMatch && difficultyMatch;
    });

    if (!filteredPool.length) {
      alert('No questions found for that combo. Try loosening filters.');
      return;
    }

    const selected = shuffle(filteredPool).slice(0, settings.questionCount || 8);

    setSessionQuestions(selected);
    setSessionMode(duration);
    setSessionActive(true);
    setTimeRemaining(duration * 60);
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setSessionResults(null);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
  };

  const handleSelectAnswer = (index) => {
    if (!answered) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (settings.mode === 'flash') {
      // flip card: show answer and auto-advance on next tap
      setAnswered(true);
      return;
    }
    if (selectedAnswer === null) {
      alert('Please select an answer');
      return;
    }

    const currentQuestion = sessionQuestions[questionIndex];
    if (!currentQuestion) return;

    if (selectedAnswer === currentQuestion.correct) {
      const nextStreak = streak + 1;
      setScore(score + difficultyScore(currentQuestion.difficulty));
      setStreak(nextStreak);
      setBestStreak(Math.max(bestStreak, nextStreak));
      setCorrectCount(correctCount + 1);
    } else {
      setStreak(0);
    }
    setAnswered(true);
  };

  const handleNextQuestion = () => {
    if (questionIndex < sessionQuestions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      handleEndSession();
    }
  };

  const handleSkip = () => {
    setStreak(0);
    handleNextQuestion();
  };

  const handleEndSession = () => {
    const answeredQuestions = questionIndex + 1;
    const totalQuestions = sessionQuestions.length || 1;
    const percentage = (score / (totalQuestions * 20)) * 100;
    setSessionResults({
      score,
      totalQuestions,
      answeredQuestions,
      percentage: Math.min(100, Math.max(0, Math.round(percentage))),
      accuracy: Math.round((correctCount / answeredQuestions) * 100) || 0,
      bestStreak,
      timeTaken: sessionMode ? sessionMode * 60 - (timeRemaining || 0) : 0
    });
    setSessionActive(false);
    setSessionMode(null);
  };

  const resetSession = () => {
    setSessionResults(null);
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setSessionActive(false);
    setSessionMode(null);
    setSessionQuestions([]);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
  };

  if (!sessionActive && !sessionResults) {
    return (
      <div className="quick-practice-container">
      <div className="quick-practice-hero">
        <div>
          <p className="eyebrow">Premium • Skill Drills</p>
          <h2>⚡ Quick Practice Sessions</h2>
          <p>Pick a duration, focus area, difficulty, and mode. We’ll assemble a balanced set of questions for you.</p>
        </div>
        <div className="settings-panel">
            <div className="setting">
              <label>Focus Area</label>
              <select value={settings.category} onChange={(e) => setSettings({ ...settings, category: e.target.value })}>
                <option>All</option>
                <option>DSA</option>
                <option>Frontend</option>
                <option>Backend</option>
                <option>Web</option>
                <option>JavaScript</option>
                <option>System Design</option>
              </select>
            </div>
            <div className="setting">
              <label>Difficulty</label>
              <select value={settings.difficulty} onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}>
                <option>Any</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div className="setting">
              <label>Questions</label>
              <input
                type="number"
                min="4"
                max="12"
                value={settings.questionCount}
                onChange={(e) => setSettings({ ...settings, questionCount: Number(e.target.value) })}
              />
            </div>
            <div className="setting">
              <label>Mode</label>
              <select value={settings.mode} onChange={(e) => setSettings({ ...settings, mode: e.target.value })}>
                <option value="mcq">MCQ</option>
                <option value="flash">Flashcards</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modes-grid">
          {modes.map((mode, index) => (
            <button
              key={index}
              className="mode-card"
              style={{ borderColor: mode.color }}
              onClick={() => startSession(mode.duration)}
            >
              <div className="mode-icon">{mode.icon}</div>
              <div className="mode-label">{mode.label}</div>
              <div className="mode-questions">{settings.questionCount} Questions · {settings.category}</div>
            </button>
          ))}
        </div>

        <div className="quick-practice-info">
          <h3>Session tips</h3>
          <ul>
            <li>✓ Pace yourself — timer is visible at all times</li>
            <li>✓ Streak bonuses encourage consecutive correct answers</li>
            <li>✓ Instant feedback with explanations to close gaps</li>
            <li>✓ Adjust difficulty and focus to match your interview target</li>
          </ul>
        </div>
      </div>
    );
  }

  if (sessionResults) {
    return (
      <div className="quick-practice-container">
        <div className="results-card">
          <div className="results-header">
            <h2>Session Complete! 🎉</h2>
          </div>
          <div className="results-stats">
            <div className="stat">
              <div className="stat-label">Score</div>
              <div className="stat-value">{sessionResults.score}/{sessionResults.totalQuestions * 10}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Percentage</div>
              <div className="stat-value">{sessionResults.percentage}%</div>
            </div>
            <div className="stat">
              <div className="stat-label">Questions Answered</div>
              <div className="stat-value">{sessionResults.answeredQuestions}/{sessionResults.totalQuestions}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Time Taken</div>
              <div className="stat-value">{Math.floor(sessionResults.timeTaken / 60)}m {sessionResults.timeTaken % 60}s</div>
            </div>
            <div className="stat">
              <div className="stat-label">Accuracy</div>
              <div className="stat-value">{sessionResults.accuracy}%</div>
            </div>
            <div className="stat">
              <div className="stat-label">Best Streak</div>
              <div className="stat-value">{sessionResults.bestStreak}</div>
            </div>
          </div>
          <button className="btn-primary" onClick={resetSession}>Try Another Session</button>
        </div>
      </div>
    );
  }

  const currentQuestion = sessionQuestions[questionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="quick-practice-container">
      <div className="session-header">
        <div className="timer">⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
        <div className="progress">Question {questionIndex + 1}/{sessionQuestions.length}</div>
        <div className="streak">🔥 Streak: {streak}</div>
      </div>

      <div className="question-card">
        <h3>{currentQuestion.question}</h3>

        {settings.mode === 'flash' ? (
          <div className="options flash">
            {!answered ? (
              <div className="flash-face">
                <p>Think of the answer, then tap reveal.</p>
                <button className="btn-primary submit-btn" onClick={handleSubmitAnswer}>Reveal Answer</button>
              </div>
            ) : (
              <div className="flash-face answer">
                <div className="pill ghost">Answer</div>
                <p>{currentQuestion.options[currentQuestion.correct]}</p>
                <div className="tip">Tip: {currentQuestion.tip}</div>
                <div className="actions-row">
                  <button className="btn-primary next-btn" onClick={handleNextQuestion}>
                    {questionIndex < sessionQuestions.length - 1 ? 'Next' : 'End Session'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${selectedAnswer === index ? 'selected' : ''} ${
                    answered
                      ? index === currentQuestion.correct
                        ? 'correct'
                        : index === selectedAnswer
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={answered}
                >
                  {option}
                </button>
              ))}
            </div>

            {!answered ? (
              <div className="actions-row">
                <button className="btn-secondary" onClick={handleSkip}>Skip</button>
                <button className="btn-primary submit-btn" onClick={handleSubmitAnswer}>
                  Submit Answer
                </button>
              </div>
            ) : (
              <div className="feedback">
                {selectedAnswer === currentQuestion.correct ? (
                  <p className="correct">✓ Correct! +{difficultyScore(currentQuestion.difficulty)} points</p>
                ) : (
                  <p className="incorrect">✗ Incorrect. The correct answer is: {currentQuestion.options[currentQuestion.correct]}</p>
                )}
                <p className="hint">Tip: {currentQuestion.tip}</p>
                <button className="btn-primary" onClick={handleNextQuestion}>
                  {questionIndex < sessionQuestions.length - 1 ? 'Next Question' : 'End Session'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="score-display">
        <div>Current Score: <strong>{score}</strong></div>
        <div>Accuracy so far: {Math.round((correctCount / (questionIndex + 1 || 1)) * 100) || 0}%</div>
      </div>
    </div>
  );
};

export default QuickPractice;
