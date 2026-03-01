import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import { getAllQuestions, getQuestionsByCategory } from '../data/questions';
import { getDailyStreakStats, markDailySolve } from '../services/streakService';
import '../styles/Interview.css';
import SqlRunner from '../components/SqlRunner';

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp'];
const DIFFICULTY_SCORE = { Easy: 1, Medium: 2, Hard: 3 };
const TARGET_ACCURACY = 0.7;
const HISTORY_KEY = 'practiceHistory';

const pushLocalAttempt = (attempt) => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(attempt);
    const trimmed = arr.slice(0, 200);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to persist attempt history', err);
  }
};

const getRecentAccuracy = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!arr.length) return null;
    const last = arr.slice(0, 10);
    const correct = last.filter((a) => a.correct).length;
    return correct / last.length;
  } catch (err) {
    return null;
  }
};

function getAdaptiveNextIndex(questions, answeredMap, currentIndex, solvedCurrent) {
  const recentAcc = getRecentAccuracy();
  let targetDifficulty = DIFFICULTY_SCORE[questions[currentIndex]?.difficulty] || 2;
  if (recentAcc !== null) {
    if (recentAcc > TARGET_ACCURACY + 0.1) targetDifficulty = Math.min(3, targetDifficulty + 1);
    if (recentAcc < TARGET_ACCURACY - 0.1) targetDifficulty = Math.max(1, targetDifficulty - 1);
  } else {
    targetDifficulty = Math.min(3, Math.max(1, targetDifficulty + (solvedCurrent ? 1 : -1)));
  }

  const unanswered = questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => !Object.prototype.hasOwnProperty.call(answeredMap, question.id));

  if (!unanswered.length) {
    return -1;
  }

  const sorted = unanswered.sort((a, b) => {
    const aDifficulty = DIFFICULTY_SCORE[a.question.difficulty] || 2;
    const bDifficulty = DIFFICULTY_SCORE[b.question.difficulty] || 2;
    const aDiff = Math.abs(aDifficulty - targetDifficulty);
    const bDiff = Math.abs(bDifficulty - targetDifficulty);
    if (aDiff !== bDiff) return aDiff - bDiff;
    return Math.abs(a.index - currentIndex) - Math.abs(b.index - currentIndex);
  });

  return sorted[0].index;
}

const DSA_CODING_CONFIG = {
  37: {
    functionName: 'twoSum',
    testCases: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1], comparator: 'unorderedArray' },
      { args: [[3, 2, 4], 6], expected: [1, 2], comparator: 'unorderedArray' },
      { args: [[3, 3], 6], expected: [0, 1], comparator: 'unorderedArray', hidden: true }
    ]
  },
  38: {
    functionName: 'reverseInteger',
    testCases: [
      { args: [123], expected: 321 },
      { args: [-123], expected: -321 },
      { args: [1534236469], expected: 0, hidden: true }
    ]
  },
  39: {
    functionName: 'isPalindromeList',
    testCases: [
      { args: [[1, 2, 2, 1]], expected: true },
      { args: [[1, 2]], expected: false },
      { args: [[1, 2, 3, 2, 1]], expected: true, hidden: true }
    ]
  },
  40: {
    functionName: 'mergeKLists',
    testCases: [
      { args: [[[1, 4, 5], [1, 3, 4], [2, 6]]], expected: [1, 1, 2, 3, 4, 4, 5, 6] },
      { args: [[[1], [0]]], expected: [0, 1], hidden: true }
    ]
  },
  41: {
    functionName: 'simulateLRU',
    testCases: [
      {
        args: [2, [['put', 1, 1], ['put', 2, 2], ['get', 1], ['put', 3, 3], ['get', 2], ['put', 4, 4], ['get', 1], ['get', 3], ['get', 4]]],
        expected: [null, null, 1, null, -1, null, -1, 3, 4]
      }
    ]
  },
  42: {
    functionName: 'ladderLength',
    testCases: [
      { args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']], expected: 5 },
      { args: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log']], expected: 0, hidden: true }
    ]
  },
  43: {
    functionName: 'isValid',
    testCases: [
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false },
      { args: ['([)]'], expected: false, hidden: true }
    ]
  },
  44: {
    functionName: 'maxProfit',
    testCases: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0, hidden: true }
    ]
  },
  45: {
    functionName: 'maxSubArray',
    testCases: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1, hidden: true }
    ]
  },
  46: {
    functionName: 'productExceptSelf',
    testCases: [
      { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0], hidden: true }
    ]
  },
  47: {
    functionName: 'lengthOfLongestSubstring',
    testCases: [
      { args: ['abcabcbb'], expected: 3 },
      { args: ['bbbbb'], expected: 1, hidden: true }
    ]
  },
  48: {
    functionName: 'numIslands',
    testCases: [
      { args: [[['1', '1', '0'], ['0', '1', '0'], ['1', '0', '1']]], expected: 3 },
      { args: [[['1', '1'], ['1', '1']]], expected: 1, hidden: true }
    ]
  },
  49: {
    functionName: 'climbStairs',
    testCases: [
      { args: [5], expected: 8 },
      { args: [2], expected: 2, hidden: true }
    ]
  },
  50: {
    functionName: 'coinChange',
    testCases: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1, hidden: true }
    ]
  },
  600: {
    functionName: 'rotate',
    testCases: [
      { args: [[1,2,3,4,5,6,7], 3], expected: [5,6,7,1,2,3,4] },
      { args: [[-1,-100,3,99], 2], expected: [3,99,-1,-100], hidden: true }
    ]
  },
  601: {
    functionName: 'search',
    testCases: [
      { args: [[4,5,6,7,0,1,2], 0], expected: 4 },
      { args: [[4,5,6,7,0,1,2], 3], expected: -1, hidden: true }
    ]
  },
  602: {
    functionName: 'rob',
    testCases: [
      { args: [[1,2,3,1]], expected: 4 },
      { args: [[2,7,9,3,1]], expected: 12, hidden: true }
    ]
  },
  603: {
    functionName: 'uniquePaths',
    testCases: [
      { args: [3, 7], expected: 28 },
      { args: [3, 2], expected: 3, hidden: true }
    ]
  },
  604: {
    functionName: 'searchBST',
    testCases: [
      { args: [[-1,0,3,5,9,12], 9], expected: 4 },
      { args: [[-1,0,3,5,9,12], 2], expected: -1, hidden: true }
    ]
  },
  605: {
    functionName: 'maxProduct',
    testCases: [
      { args: [[2,3,-2,4]], expected: 6 },
      { args: [[-2,0,-1]], expected: 0, hidden: true }
    ]
  },
  606: {
    functionName: 'spiralOrder',
    testCases: [
      { args: [[[1,2,3],[4,5,6],[7,8,9]]], expected: [1,2,3,6,9,8,7,4,5] },
      { args: [[[1,2],[3,4]]], expected: [1,2,4,3], hidden: true }
    ]
  },
  607: {
    functionName: 'isAnagram',
    testCases: [
      { args: ['anagram', 'nagaram'], expected: true },
      { args: ['rat', 'car'], expected: false, hidden: true }
    ]
  },
  608: {
    functionName: 'floodFill',
    testCases: [
      { args: [[[1,1,1],[1,1,0],[1,0,1]], 1, 1, 2], expected: [[2,2,2],[2,2,0],[2,0,1]] },
      { args: [[[0,0,0],[0,0,0]], 0, 0, 0], expected: [[0,0,0],[0,0,0]], hidden: true }
    ]
  },
  609: {
    functionName: 'plusOne',
    testCases: [
      { args: [[1,2,3]], expected: [1,2,4] },
      { args: [[9,9,9]], expected: [1,0,0,0], hidden: true }
    ]
  }
};

function getStarterCode(functionName, language) {
  if (language === 'javascript') {
    return `function ${functionName}(...args) {
  // Write your solution here.
  return null;
}`;
  }

  if (language === 'python') {
    return `def ${functionName}(*args):
    # Write your solution here.
    return None`;
  }

  if (language === 'java') {
    return `import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine(); // JSON array input from runner
        // Parse input and print JSON output.
        System.out.println("null");
    }
}`;
  }

  return `#include <iostream>
#include <string>
using namespace std;

int main() {
    string input;
    getline(cin, input); // JSON array input from runner
    // Parse input and print JSON output.
    cout << "null";
    return 0;
}`;
}

export default function Interview() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || 'all';
  const searchTerm = (location.state?.searchTerm || '').trim().toLowerCase();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswerMap, setSelectedAnswerMap] = useState({});
  const [answeredMap, setAnsweredMap] = useState({});
  const [awardedMap, setAwardedMap] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [solveStreak, setSolveStreak] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(() => getDailyStreakStats().currentStreak);
  const [bestSolveStreak, setBestSolveStreak] = useState(() => {
    const stored = Number(localStorage.getItem('bestSolveStreak') || 0);
    return Number.isNaN(stored) ? 0 : stored;
  });
  const [languageMap, setLanguageMap] = useState({});
  const [codeMap, setCodeMap] = useState({});
  const [runResult, setRunResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [interviewMode, setInterviewMode] = useState('standard');
  const [lastOutcome, setLastOutcome] = useState(null);
  const [customTests, setCustomTests] = useState([{ input: '', expected: '' }]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showEditorial, setShowEditorial] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(Date.now());
  const SOLVED_KEY = 'solvedQuestionIds';
  const [solvedIds, setSolvedIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]');
      return new Set(saved);
    } catch {
      return new Set();
    }
  });
  const [hideSolved, setHideSolved] = useState(true);

  const questions = useMemo(() => {
    const byCategory = category === 'all'
      ? getAllQuestions()
      : getQuestionsByCategory(category);

    let filtered = byCategory;
    if (searchTerm) {
      filtered = filtered.filter((question) => {
        const haystack = `${question.title} ${question.description} ${question.category} ${question.subCategory || ''}`.toLowerCase();
        return haystack.includes(searchTerm);
      });
      if (filtered.length === 0) {
        filtered = byCategory;
      }
    } else if (category === 'all') {
      filtered = filtered.slice(0, 10);
    }

    if (hideSolved && solvedIds.size) {
      const unsolved = filtered.filter((q) => !solvedIds.has(q.id));
      if (unsolved.length) filtered = unsolved;
    }

    return filtered;
  }, [category, searchTerm, hideSolved, solvedIds]);

  const currentQ = questions[currentQuestion];
  const codingConfig = currentQ ? DSA_CODING_CONFIG[currentQ.id] : null;
  const isSqlQuestion = currentQ?.runner === 'sql';
  const isCodingQuestion = Boolean(codingConfig) || isSqlQuestion;
  const isAnswered = currentQ ? Object.prototype.hasOwnProperty.call(answeredMap, currentQ.id) : false;
  const currentAnswer = currentQ ? selectedAnswerMap[currentQ.id] : null;
  const isCorrectMcq = currentQ ? currentAnswer === currentQ.correct : false;

  const currentLanguage = currentQ ? (languageMap[currentQ.id] || 'javascript') : 'javascript';
  const codeKey = currentQ ? `${currentQ.id}:${currentLanguage}` : '';
  const starterCode = codingConfig ? getStarterCode(codingConfig.functionName, currentLanguage) : '';
  const codeValue = codeKey ? (codeMap[codeKey] ?? starterCode) : '';
  const parsedCustomTests = useMemo(() => {
    const cases = [];
    customTests.forEach(({ input, expected }) => {
      if (!input && !expected) return;
      try {
        const parsedInput = input ? JSON.parse(input) : [];
        const parsedExpected = expected ? JSON.parse(expected) : null;
        const args = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
        cases.push({ args, expected: parsedExpected });
      } catch (err) {
        // ignore here, handled in executeCode
      }
    });
    return cases;
  }, [customTests]);

  const resultRows = useMemo(() => {
    return questions.map((q) => {
      const isCoding = Boolean(DSA_CODING_CONFIG[q.id]);
      const attempted = Object.prototype.hasOwnProperty.call(answeredMap, q.id);
      if (!attempted) return { id: q.id, question: q.title, answer: 'Skipped' };
      if (isCoding) return { id: q.id, question: q.title, answer: awardedMap[q.id] ? 'Correct' : 'Incorrect' };
      return {
        id: q.id,
        question: q.title,
        answer: selectedAnswerMap[q.id] === q.correct ? 'Correct' : 'Incorrect'
      };
    });
  }, [questions, answeredMap, selectedAnswerMap, awardedMap]);

  const markQuestionAwarded = (questionId) => {
    if (awardedMap[questionId]) return;
    setAwardedMap((prev) => ({ ...prev, [questionId]: true }));
    setScore((prev) => prev + 1);
    setSolvedIds((prev) => {
      if (prev.has(questionId)) return prev;
      const next = new Set(prev);
      next.add(questionId);
      localStorage.setItem(SOLVED_KEY, JSON.stringify([...next]));
      return next;
    });
    const streakStats = markDailySolve();
    setDailyStreak(streakStats.currentStreak);
    setSolveStreak((prev) => {
      const next = prev + 1;
      if (next > bestSolveStreak) {
        setBestSolveStreak(next);
        localStorage.setItem('bestSolveStreak', String(next));
      }
      return next;
    });
  };

  const markQuestionFailed = (questionId) => {
    setAnsweredMap((prev) => ({ ...prev, [questionId]: false }));
    setAwardedMap((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setScore((prev) => (awardedMap[questionId] ? Math.max(0, prev - 1) : prev));
    setSolveStreak(0);
  };

  const clearSolved = () => {
    setSolvedIds(new Set());
    localStorage.removeItem(SOLVED_KEY);
  };

  const getElapsedMinutes = () => Math.max(1, Math.round((Date.now() - questionStartTs) / 60000));

  const syncProgress = async (question, solved, testsPassed = 0, timeOverride = null) => {
    if (!question) return;
    try {
      const minutesSpent = timeOverride !== null ? timeOverride : getElapsedMinutes();
      await axios.post('/api/progress/update', {
        problemId: String(question.id),
        solved: Boolean(solved),
        timeSpent: minutesSpent,
        hintsUsed: 0,
        language: isCodingQuestion ? currentLanguage : 'mcq',
        category: question.category,
        difficulty: question.difficulty,
        testsPassed
      });
    } catch (error) {
      // Keep quiz flow responsive even if tracking fails.
      console.error('Progress sync failed:', error?.response?.data || error.message);
    }
  };

  const fetchSubmissionHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get('/api/submissions/user/history?limit=8');
      setSubmissionHistory(response?.data || []);
    } catch (error) {
      setSubmissionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isCodingQuestion) fetchSubmissionHistory();
  }, [isCodingQuestion]);

  // reset per-question toggles
  useEffect(() => {
    setShowHint(false);
    setShowEditorial(false);
    setRunResult(null);
    setQuestionStartTs(Date.now());
  }, [currentQ?.id]);

  useEffect(() => {
    if (currentQuestion >= questions.length) {
      setCurrentQuestion(0);
      setShowExplanation(false);
    }
  }, [questions.length]);

  const handleSelectAnswer = (index) => {
    if (!currentQ || isCodingQuestion || isAnswered) return;
    setSelectedAnswerMap((prev) => ({ ...prev, [currentQ.id]: index }));
    setAnsweredMap((prev) => ({ ...prev, [currentQ.id]: true }));
    setShowExplanation(true);
    const solved = index === currentQ.correct;
    setLastOutcome(solved);
    const timeSpentMs = Date.now() - questionStartTs;
    pushLocalAttempt({
      id: currentQ.id,
      category: currentQ.category,
      difficulty: currentQ.difficulty,
      correct: solved,
      timeMs: timeSpentMs,
      ts: Date.now()
    });
    if (solved) markQuestionAwarded(currentQ.id);
    else markQuestionFailed(currentQ.id);
    syncProgress(currentQ, solved, solved ? 1 : 0, Math.max(1, Math.round(timeSpentMs / 60000)));
  };

  const executeCode = async (includeHidden, persistSubmission = false) => {
    if (!currentQ || (!codingConfig && !isSqlQuestion)) return null;
    // Validate custom tests
    try {
      customTests.forEach(({ input, expected }) => {
        if (!input && !expected) return;
        JSON.parse(input || '[]');
        if (expected) JSON.parse(expected);
      });
    } catch (err) {
      const failedResult = {
        success: false,
        error: 'Invalid JSON in custom test cases. Please fix and try again.',
        tests: [],
        runtimeMs: 0,
        executed: 0,
        total: codingConfig.testCases.length
      };
      setRunResult(failedResult);
      return failedResult;
    }

    const mergedTests = [...codingConfig.testCases, ...parsedCustomTests];
    setIsExecuting(true);
    try {
      let result;
      if (isSqlQuestion) {
        // For SQL, we only run locally; use mergedTests to display expected structure.
        result = { success: true, tests: mergedTests.map((t) => ({ passed: true, ...t })), runtimeMs: 0 };
      } else {
        const response = await axios.post('/api/submissions/execute', {
          language: currentLanguage,
          code: codeValue,
          functionName: codingConfig.functionName,
          testCases: mergedTests,
          includeHidden,
          persistSubmission,
          questionMeta: {
            questionId: currentQ.id,
            title: currentQ.title,
            category: currentQ.category,
            difficulty: currentQ.difficulty
          }
        });
        result = response.result;
      }
      setRunResult(result || null);
      if (persistSubmission && !isSqlQuestion) fetchSubmissionHistory();
      return result || null;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Execution failed';
      const failedResult = {
        success: false,
        error: errorMessage,
        tests: [],
        runtimeMs: 0,
        executed: 0,
        total: mergedTests.length
      };
      setRunResult(failedResult);
      return failedResult;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunCode = async () => {
    await executeCode(false, false);
  };

  const handleSubmitCode = async () => {
    const result = await executeCode(true, true);
    if (!result) {
      if (currentQ) markQuestionFailed(currentQ.id);
      setShowExplanation(false);
      if (currentQ) syncProgress(currentQ, false, 0, getElapsedMinutes());
      return;
    }
    if (result.error) {
      if (currentQ) markQuestionFailed(currentQ.id);
      setShowExplanation(false);
      if (currentQ) syncProgress(currentQ, false, 0, getElapsedMinutes());
      return;
    }
    const allPassed = result.tests.length > 0 && result.tests.every((test) => test.passed);
    if (!allPassed) {
      setLastOutcome(false);
      if (currentQ) markQuestionFailed(currentQ.id);
      setShowExplanation(false);
      if (currentQ) syncProgress(currentQ, false, result.tests.filter((test) => test.passed).length, getElapsedMinutes());
      if (currentQ) {
        const timeSpentMs = Date.now() - questionStartTs;
        pushLocalAttempt({
          id: currentQ.id,
          category: currentQ.category,
          difficulty: currentQ.difficulty,
          correct: false,
          timeMs: timeSpentMs,
          ts: Date.now()
        });
      }
      return;
    }
    if (currentQ) {
      setLastOutcome(true);
      setAnsweredMap((prev) => ({ ...prev, [currentQ.id]: true }));
      markQuestionAwarded(currentQ.id);
      syncProgress(currentQ, true, result.tests.length, getElapsedMinutes());
      const timeSpentMs = Date.now() - questionStartTs;
      pushLocalAttempt({
        id: currentQ.id,
        category: currentQ.category,
        difficulty: currentQ.difficulty,
        correct: true,
        timeMs: timeSpentMs,
        ts: Date.now()
      });
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!currentQ) return;

    const allAttempted = questions.every((q) => Object.prototype.hasOwnProperty.call(answeredMap, q.id));
    if (allAttempted) {
      navigate('/results/summary', {
        state: {
          score,
          total: questions.length,
          accuracy: Math.round((score / questions.length) * 100),
          timeTaken: Math.floor(Math.random() * 30) + 10,
          category: location.state?.category || 'Mixed Topics',
          questionsDetails: resultRows.map((row) => ({ ...row, time: 0 }))
        }
      });
      return;
    }

    if (interviewMode === 'adaptive' && lastOutcome !== null) {
      const adaptiveIndex = getAdaptiveNextIndex(questions, answeredMap, currentQuestion, lastOutcome);
      if (adaptiveIndex >= 0) {
        setCurrentQuestion(adaptiveIndex);
        setShowExplanation(false);
        setRunResult(null);
        return;
      }
    }

    const nextLinearIndex = questions.findIndex(
      (q, idx) => idx > currentQuestion && !Object.prototype.hasOwnProperty.call(answeredMap, q.id)
    );
    if (nextLinearIndex >= 0) {
      setCurrentQuestion(nextLinearIndex);
      setShowExplanation(false);
      setRunResult(null);
      return;
    }

    const firstUnanswered = questions.findIndex((q) => !Object.prototype.hasOwnProperty.call(answeredMap, q.id));
    if (firstUnanswered >= 0) {
      setCurrentQuestion(firstUnanswered);
      setShowExplanation(false);
      setRunResult(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion === 0) return;
    setCurrentQuestion((prev) => prev - 1);
    setShowExplanation(false);
    setRunResult(null);
  };

  // Timed mode countdown
  useEffect(() => {
    if (interviewMode !== 'timed' || !currentQ) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(120);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          // auto fail current question
          if (isCodingQuestion) {
            markQuestionFailed(currentQ.id);
            setRunResult({
              success: false,
              error: 'Time expired',
              tests: [],
              runtimeMs: 0,
              executed: 0,
              total: codingConfig?.testCases?.length || 0
            });
          } else {
            handleSelectAnswer(-1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQ?.id, interviewMode]);

  if (questions.length === 0) {
    return (
      <div className="interview-container">
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No questions found for "{location.state?.searchTerm || ''}".
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container">
      <div className="interview-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <div className="header-stats">
            <div className="mode-toggle-wrap">
              <label htmlFor="interview-mode-select">Mode</label>
              <select
                id="interview-mode-select"
                className="mode-select"
                value={interviewMode}
                onChange={(e) => setInterviewMode(e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="adaptive">Adaptive</option>
                <option value="timed">Timed</option>
              </select>
            </div>
            <div className="mode-toggle-wrap">
              <label>
                <input
                  type="checkbox"
                  checked={hideSolved}
                  onChange={(e) => setHideSolved(e.target.checked)}
                  style={{ marginRight: '6px' }}
                />
                Hide solved
              </label>
              <button className="btn-secondary" style={{ marginLeft: '8px' }} onClick={clearSolved}>
                Reset solved
              </button>
            </div>
            <div className="progress-info">Question {currentQuestion + 1} of {questions.length}</div>
            <div className="score-info">Score: {score}/{questions.length}</div>
            <div className="score-info">Streak: {solveStreak} | Best: {bestSolveStreak}</div>
            <div className="score-info">Daily Streak: {dailyStreak} day{dailyStreak === 1 ? '' : 's'}</div>
            {timeLeft !== null && (
              <div className="score-info" style={{ color: timeLeft < 15 ? '#f87171' : undefined }}>
                Time left: {timeLeft}s
              </div>
            )}
          </div>
        </div>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="interview-content">
          <div className="question-container">
            <div className="question-info">
              <div className="info-badges">
                <span className="category-badge">{currentQ.subCategory || currentQ.category}</span>
                <span className={`difficulty-badge ${currentQ.difficulty.toLowerCase()}`}>{currentQ.difficulty}</span>
                {interviewMode === 'adaptive' ? <span className="adaptive-badge">Adaptive</span> : null}
              </div>
              <div className="question-text">
                <h2>{currentQ.title}</h2>
                {currentQ.description ? <p className="question-description">{currentQ.description}</p> : null}
              </div>
            </div>

          {isSqlQuestion ? (
            <div className="coding-layout">
              <div className="coding-meta">
                <h3>Problem Statement</h3>
                <p>{currentQ.problemDetails?.statement}</p>
                <h4>Example</h4>
                <pre>{currentQ.problemDetails?.example}</pre>
                <h4>Schema</h4>
                <pre>{currentQ.schema || ''}</pre>
                <h4>Seed Data</h4>
                <pre>{currentQ.seedData || ''}</pre>
                <h4>Constraints</h4>
                <p>{currentQ.problemDetails?.constraints}</p>
              </div>

              <div className="coding-editor-wrapper">
                <SqlRunner
                  schema={currentQ.schema}
                  seed={currentQ.seedData}
                  defaultQuery={currentQ.defaultQuery}
                  onRun={(res) => setRunResult({ success: true, tests: [], runtimeMs: 0, rows: res })}
                />
              </div>
            </div>
          ) : isCodingQuestion ? (
            <div className="coding-layout">
              <div className="coding-meta">
                <h3>Problem Statement</h3>
                <p>{currentQ.problemDetails?.statement}</p>
                <h4>Example</h4>
                <pre>{currentQ.problemDetails?.example}</pre>
                <h4>Constraints</h4>
                <p>{currentQ.problemDetails?.constraints}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button className="btn-nav next" onClick={() => setShowHint((v) => !v)}>
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  <button className="btn-nav prev" onClick={() => setShowEditorial((v) => !v)}>
                    {showEditorial ? 'Hide Editorial' : 'View Editorial'}
                  </button>
                </div>
                {showHint && (
                  <div className="explanation-box" style={{ marginTop: '10px' }}>
                    <div className="explanation-title">Hint</div>
                    <div className="explanation-text">
                      {currentQ.hint || currentQ.problemDetails?.followUp || 'Hint not available yet.'}
                    </div>
                  </div>
                )}
                {showEditorial && (
                  <div className="explanation-box incorrect-explanation" style={{ marginTop: '10px' }}>
                    <div className="explanation-title">Editorial</div>
                    <div className="explanation-text">
                      {currentQ.editorial || currentQ.problemDetails?.editorial || 'Editorial coming soon.'}
                    </div>
                  </div>
                )}
              </div>

              <div className="coding-editor-wrapper">
                <div className="coding-toolbar">
                  <label>
                    Language:
                    <select
                      className="language-select"
                      value={currentLanguage}
                      onChange={(e) => {
                        const nextLanguage = e.target.value;
                        if (!currentQ) return;
                        setLanguageMap((prev) => ({ ...prev, [currentQ.id]: nextLanguage }));
                        markQuestionFailed(currentQ.id);
                        setRunResult(null);
                        setShowExplanation(false);
                      }}
                    >
                      {SUPPORTED_LANGUAGES.map((language) => (
                        <option key={language} value={language}>{language.toUpperCase()}</option>
                      ))}
                    </select>
                  </label>

                  <div className="coding-actions">
                    <button className="btn-nav prev" onClick={handleRunCode} disabled={isExecuting}>
                      {isExecuting ? 'Running...' : 'Run'}
                    </button>
                    <button className="btn-nav next" onClick={handleSubmitCode} disabled={isExecuting}>
                      {isExecuting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </div>

                <textarea
                  className="code-editor"
                  value={codeValue}
                  onChange={(e) => setCodeMap((prev) => ({ ...prev, [codeKey]: e.target.value }))}
                  spellCheck={false}
                />

                <div className="test-helper-text">
                  Run executes visible tests only. Submit executes all tests including hidden tests.
                </div>
                {currentLanguage === 'java' || currentLanguage === 'cpp' ? (
                  <div className="test-helper-text">
                    For JAVA, write LeetCode-style `class Solution` with method `{codingConfig.functionName}`. Full `Main` class is also supported.
                    For CPP, provide a full runnable program that reads stdin and prints output.
                  </div>
                ) : null}

                <div className="test-helper-text">
                  <strong>Custom test cases</strong> (JSON). Input should be an array of args, Expected as JSON value.
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {customTests.map((t, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                        <input
                          placeholder='Input args (e.g., [[2,7,11,15],9])'
                          value={t.input}
                          onChange={(e) => {
                            const next = [...customTests];
                            next[idx].input = e.target.value;
                            setCustomTests(next);
                          }}
                        />
                        <input
                          placeholder='Expected (e.g., [0,1])'
                          value={t.expected}
                          onChange={(e) => {
                            const next = [...customTests];
                            next[idx].expected = e.target.value;
                            setCustomTests(next);
                          }}
                        />
                        <button
                          className="btn-nav prev"
                          onClick={() => setCustomTests((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={customTests.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn-nav next"
                      onClick={() => setCustomTests((prev) => [...prev, { input: '', expected: '' }])}
                    >
                      + Add test
                    </button>
                  </div>
                </div>

                {runResult && (
                  <div className="test-results">
                    <div className="test-results-header">
                      <strong>Execution Result</strong>
                      <span>{runResult.runtimeMs} ms</span>
                    </div>
                    <div className="test-summary">
                      Executed {runResult.executed}/{runResult.total} test cases
                    </div>
                    {runResult.error && <div className="test-error">{runResult.error}</div>}
                    {!runResult.tests?.length && !runResult.error ? (
                      <div className="test-error">No test results returned by executor.</div>
                    ) : null}
                    {runResult.tests?.map((test) => (
                      <div key={test.id} className={`test-row ${test.passed ? 'pass' : 'fail'} test-row-block`}>
                        <div className="test-row-header">
                          <span>Test {test.id}</span>
                          <span>{test.passed ? 'Passed' : 'Failed'}</span>
                        </div>
                        {!test.passed ? (
                          <div className="test-row-detail">
                            <div><strong>Expected:</strong> {JSON.stringify(test.expected)}</div>
                            <div><strong>Actual:</strong> {JSON.stringify(test.actual)}</div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="options-container">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    currentAnswer === index
                      ? isCorrectMcq ? 'correct' : 'incorrect'
                      : isAnswered && index === currentQ.correct ? 'correct' : ''
                  }`}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isAnswered}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          )}

          {showExplanation && (
            <div className={`explanation-box ${isCodingQuestion || isCorrectMcq ? 'correct-explanation' : 'incorrect-explanation'}`}>
              <div className="explanation-header">
                <span className="explanation-title">
                  {isCodingQuestion || isCorrectMcq ? `Accepted | Streak ${solveStreak}` : 'Incorrect'}
                </span>
              </div>
              <div className="explanation-text">
                <h4>Explanation</h4>
                <p>{currentQ.explanation}</p>
                {currentQ.timeComplexity && <p><strong>Time:</strong> {currentQ.timeComplexity}</p>}
                {currentQ.spaceComplexity && <p><strong>Space:</strong> {currentQ.spaceComplexity}</p>}
              </div>
            </div>
          )}

          <div className="navigation-buttons">
            <button className="btn-nav prev" onClick={handlePreviousQuestion} disabled={currentQuestion === 0}>
              Previous
            </button>
            <button className={`btn-nav next ${!isAnswered ? 'disabled' : ''}`} onClick={handleNextQuestion} disabled={!isAnswered}>
              {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </button>
          </div>
        </div>

        <div className="interview-sidebar">
          <div className="sidebar-card">
            <h3>Quiz Progress</h3>
            <div className="progress-stats">
              <div className="stat">
                <div className="stat-number">{score}</div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat">
                <div className="stat-number">
                  {Math.max(0, questions.filter((q) => Object.prototype.hasOwnProperty.call(answeredMap, q.id)).length - score)}
                </div>
                <div className="stat-label">Incorrect</div>
              </div>
              <div className="stat">
                <div className="stat-number">{Math.round((score / (currentQuestion + 1)) * 100)}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="stat">
                <div className="stat-number">{solveStreak}</div>
                <div className="stat-label">Streak</div>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Question Navigator</h3>
            <div className="question-navigator">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  className={`nav-dot ${index === currentQuestion ? 'current' : ''} ${Object.prototype.hasOwnProperty.call(answeredMap, q.id) ? 'answered' : ''} ${solvedIds.has(q.id) ? 'solved' : ''}`}
                  onClick={() => {
                    if (index === currentQuestion) return;
                    setCurrentQuestion(index);
                    setShowExplanation(false);
                    setRunResult(null);
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {isCodingQuestion ? (
            <div className="sidebar-card">
              <h3>Recent Submissions</h3>
              {historyLoading ? (
                <div className="submission-empty">Loading...</div>
              ) : submissionHistory.length === 0 ? (
                <div className="submission-empty">No submissions yet</div>
              ) : (
                <div className="submission-list">
                  {submissionHistory.map((entry) => (
                    <div key={`${entry._id}-${entry.submittedAt}`} className="submission-item">
                      <div className="submission-title">{entry.questionTitle || `Question ${entry.externalQuestionId}`}</div>
                      <div className="submission-meta">
                        <span>{String(entry.language || '').toUpperCase()}</span>
                        <span className={entry.status === 'Accepted' ? 'status-pass' : 'status-fail'}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
