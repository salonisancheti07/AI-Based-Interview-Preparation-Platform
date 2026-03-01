const express = require('express');
const MockInterview = require('../models/MockInterview');
const UserPerformance = require('../models/UserPerformance');
const LearningPath = require('../models/LearningPath');
const ChatSession = require('../models/ChatSession');
const ResumeData = require('../models/ResumeData');
const KnowledgeGraph = require('../models/KnowledgeGraph');
const ProjectInterview = require('../models/ProjectInterview');
const AIEvaluator = require('../services/AIEvaluator');
const RAGService = require('../services/RAGService');
const { auth, authorize, authOptional } = require('../middleware/auth');
const { getCache, setCache, withRetry } = require('../utils/aiClient');
const { PassThrough } = require('stream');

const router = express.Router();

// -------- AI Assist (Code Critique / Behavioral Grader) --------
router.post('/assist/critique', authOptional, async (req, res) => {
  try {
    const { code = '' } = req.body || {};
    if (!code.trim()) return res.status(400).json({ success: false, message: 'Code is required' });

    let critique;
    try {
      critique = await AIEvaluator.evaluateCodingSolution(code, { question: 'User code snippet' }, []);
    } catch (err) {
      console.error('AI critique fallback:', err.message);
    }

    if (!critique?.feedback) {
      // Lightweight fallback feedback
      const usesHash = /map|hash|dict/i.test(code);
      const hasTwoSum = /two\s*sum/i.test(code);
      const feedback = [
        hasTwoSum ? 'Looks like a Two Sum solution.' : 'General critique:',
        usesHash ? '• Uses a hash map: likely O(n) time, O(n) space.' : '• Consider using a hash map for O(n) lookup.',
        '• Add input validation and early returns.',
        '• Include small/edge test cases (empty, single element, duplicates).'
      ].join('\n');
      return res.json({ success: true, feedback });
    }

    res.json({ success: true, feedback: critique.feedback || JSON.stringify(critique) });
  } catch (err) {
    console.error('Critique error:', err);
    res.status(500).json({ success: false, message: 'Critique failed' });
  }
});

router.post('/assist/behavioral', authOptional, async (req, res) => {
  try {
    const { answer = '' } = req.body || {};
    if (!answer.trim()) return res.status(400).json({ success: false, message: 'Answer is required' });

    // Simple per-user/IP rate limiter (1 request / 20s)
    const now = Date.now();
    const clientKey = req.userId || req.ip || 'anon';
    const lastHit = behavioralLimiter.get(clientKey) || 0;
    if (now - lastHit < 20_000) {
      return res.status(429).json({ success: false, message: 'Too many behavioral requests. Wait a few seconds.' });
    }
    behavioralLimiter.set(clientKey, now);

    const feedback = await AIEvaluator.evaluateBehavioralAnswer('User behavioral answer', answer);
    if (feedback?.error && feedback?.fallback) {
      return res.status(200).json({ success: true, feedback: feedback.feedback, fallback: true });
    }
    if (feedback?.error) {
      return res.status(429).json({ success: false, message: feedback.error, details: feedback.details });
    }
    res.json({ success: true, feedback: feedback?.feedback || JSON.stringify(feedback) });
  } catch (err) {
    console.error('Behavioral grade error:', err);
    const status = err.message?.includes('rate limit') ? 429 : 500;
    res.status(status).json({ success: false, message: err.message || 'Behavioral grading failed' });
  }
});

// In-memory limiter store
const behavioralLimiter = new Map();

// -------- System Design Review --------
const systemDesignLimiter = new Map();
router.post('/assist/system-design', authOptional, async (req, res) => {
  try {
    const { scenario = 'System design', notes = '' } = req.body || {};
    if (!notes.trim()) return res.status(400).json({ success: false, message: 'Notes are required' });

    const now = Date.now();
    const clientKey = req.userId || req.ip || 'anon';
    const lastHit = systemDesignLimiter.get(clientKey) || 0;
    if (now - lastHit < 20_000) {
      return res.status(429).json({ success: false, message: 'Too many system design requests. Wait a few seconds.' });
    }
    systemDesignLimiter.set(clientKey, now);

    const feedback = await AIEvaluator.evaluateSystemDesign(scenario, notes);
    if (feedback?.error && feedback?.fallback) {
      return res.status(200).json({ success: true, feedback, fallback: true });
    }
    if (feedback?.error) {
      return res.status(429).json({ success: false, message: feedback.error, details: feedback.details });
    }
    res.json({ success: true, feedback });
  } catch (err) {
    console.error('System design grade error:', err);
    const status = err.message?.includes('rate limit') ? 429 : 500;
    res.status(status).json({ success: false, message: err.message || 'System design grading failed' });
  }
});

// ============== MOCK INTERVIEWS ==============

// Start new mock interview
router.post('/mock-interview/start', authOptional, async (req, res) => {
  try {
    const { interviewType, targetRole, targetCompany, difficulty } = req.body;
    const normalizedDifficulty = normalizeInterviewDifficulty(difficulty);

    // Demo fallback when unauthenticated
    if (!req.userId) {
      const mockQuestions = [
        { question: 'Design a URL shortener.', category: 'System Design', difficulty: 'Medium' },
        { question: 'Find two numbers that add to target.', category: 'DSA', difficulty: 'Easy' },
        { question: 'Tell me about a time you disagreed with a teammate.', category: 'Behavioral', difficulty: 'Easy' }
      ];
      return res.json({
        success: true,
        interviewId: 'mock-demo',
        questions: mockQuestions,
        startedAt: new Date(),
        message: 'Interview started in demo mode'
      });
    }

    // Generate questions based on interview type and role
    let questions = [];
    if (interviewType === 'technical') {
      questions = await generateTechnicalQuestions(targetRole, difficulty);
    } else if (interviewType === 'behavioral') {
      questions = await generateBehavioralQuestions(targetRole);
    } else if (interviewType === 'hr') {
      questions = await generateHRQuestions(targetRole);
    } else if (interviewType === 'mixed') {
      questions = [
        ...await generateTechnicalQuestions(targetRole, difficulty),
        ...await generateBehavioralQuestions(targetRole),
        ...await generateHRQuestions(targetRole)
      ].slice(0, 8); // Mix of both
    }

    if (!questions.length) {
      return res.status(400).json({ success: false, message: 'No questions generated for selected interview type' });
    }

    const mockInterview = new MockInterview({
      userId: req.userId,
      interviewType,
      targetRole,
      targetCompany,
      difficulty: normalizedDifficulty,
      questions
    });

    await mockInterview.save();

    res.json({
      success: true,
      interviewId: mockInterview._id,
      questions,
      startedAt: mockInterview.startedAt,
      message: 'Interview started'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit answer and get AI evaluation
router.post('/mock-interview/:interviewId/submit-answer', authOptional, async (req, res) => {
  try {
    const { questionIndex, userAnswer, analysis } = req.body;
    
    if (!userAnswer || userAnswer.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Answer cannot be empty' 
      });
    }

    // Demo path without DB/auth — deterministic heuristic so it feels like real scoring
    if (!req.userId || req.params.interviewId === 'mock-demo') {
      const text = userAnswer.trim();
      const words = text.split(/\s+/).length;
      const hasComplexity = /complexity|big\s*o|time|space/i.test(text);
      const hasExample = /example|eg|for instance|e\.g\./i.test(text);
      const hasStructure = /(first|second|next|finally|conclusion)/i.test(text);
      const hasEdge = /edge case|corner|limit|failure/i.test(text);

      const lengthScore = Math.min(100, Math.max(0, (words - 15) * 2)); // 0 at 15 words, 100 at 65+
      const signals = [hasComplexity, hasExample, hasStructure, hasEdge].filter(Boolean).length;
      const signalScore = signals * 15; // up to 60
      const baseScore = Math.round(Math.min(100, Math.max(30, lengthScore * 0.7 + signalScore)));

      const feedback = [];
      const improvements = [];
      if (!hasComplexity) improvements.push('State time/space complexity or trade-offs.');
      if (!hasExample) improvements.push('Add a brief example to anchor the idea.');
      if (!hasEdge) improvements.push('Mention at least one edge case or failure mode.');
      if (!hasStructure) improvements.push('Organize answer with steps or bullet-like flow.');
      if (words < 25) improvements.push('Answer is too short; aim for 4–6 sentences.');

      if (feedback.length === 0) {
        feedback.push(baseScore >= 70 ? 'Solid answer—cover complexity and edges for a stronger finish.' : 'Needs more depth and structure.');
      }

      return res.json({
        success: true,
        evaluation: {
          score: baseScore,
          correctness: baseScore,
          isCorrect: baseScore >= 70,
          relevance: Math.min(100, baseScore + 10),
          communication: Math.min(100, hasStructure ? baseScore : baseScore - 10),
          feedback: feedback.join(' '),
          strengths: ['Answered without blank', ...(hasStructure ? ['Structured flow'] : []), ...(hasComplexity ? ['Mentioned complexity'] : [])],
          improvements,
          followUpQuestions: ['How does this scale?', 'What would you optimize first?', 'What tests would you add?']
        }
      });
    }

    const mockInterview = await MockInterview.findById(req.params.interviewId);

    if (!mockInterview || mockInterview.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!mockInterview.questions[questionIndex]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid question index' 
      });
    }

    const question = mockInterview.questions[questionIndex];
    const qualityGate = evaluateAnswerQuality(question.question, userAnswer);

    // Get AI evaluation with retry + cache
    const evalCacheKey = `mock-eval|${req.params.interviewId}|${questionIndex}|${userAnswer}`;
    let evaluation = getCache(evalCacheKey);
    if (!evaluation) {
      try {
        if (qualityGate.forceLowScore) {
          evaluation = buildLowScoreEvaluation(qualityGate.reason, qualityGate);
        } else if (mockInterview.interviewType === 'technical') {
          evaluation = await withRetry(() => AIEvaluator.evaluateCodingSolution(userAnswer, question, []));
        } else {
          evaluation = await withRetry(() => AIEvaluator.evaluateBehavioralAnswer(question.question, userAnswer));
        }
        setCache(evalCacheKey, evaluation, 5 * 60 * 1000);
      } catch (aiError) {
        console.error('AI evaluation error:', aiError);
        // Fallback evaluation
        evaluation = buildLowScoreEvaluation(
          `Could not evaluate answer due to AI error: ${aiError.message}`,
          qualityGate
        );
      }
    }

    evaluation = normalizeEvaluation(evaluation, qualityGate);

    // Generate follow-up questions if available
    let followUpQuestions = [];
    try {
      followUpQuestions = await AIEvaluator.generateFollowUpQuestions(
        question.question,
        userAnswer,
        mockInterview.interviewType
      );
    } catch (err) {
      console.error('Follow-up generation error:', err);
    }

    // Behavioral + Emotional Sentiment Analysis
    let sentimentAnalysis = null;
    try {
      sentimentAnalysis = await AIEvaluator.analyzeSentiment(userAnswer, 'interview');
    } catch (err) {
      console.error('Sentiment analysis error:', err);
    }

    // Adaptive AI Engine: Adjust difficulty based on performance
    const isCorrect = evaluation.correctness >= 70; // Consider 70+ as correct
    const adaptiveState = mockInterview.adaptiveState || {};
    
    if (isCorrect) {
      adaptiveState.consecutiveCorrect = (adaptiveState.consecutiveCorrect || 0) + 1;
      adaptiveState.consecutiveIncorrect = 0;
      adaptiveState.performancePattern = (adaptiveState.performancePattern || []).concat('correct');
      
      // Increase difficulty after 2 consecutive correct answers
      if (adaptiveState.consecutiveCorrect >= 2 && adaptiveState.currentDifficulty !== 'Advanced') {
        adaptiveState.currentDifficulty = getNextDifficulty(adaptiveState.currentDifficulty, 'up');
        adaptiveState.difficultyAdjustments = (adaptiveState.difficultyAdjustments || 0) + 1;
      }
    } else {
      adaptiveState.consecutiveIncorrect = (adaptiveState.consecutiveIncorrect || 0) + 1;
      adaptiveState.consecutiveCorrect = 0;
      adaptiveState.performancePattern = (adaptiveState.performancePattern || []).concat('incorrect');
      
      // Decrease difficulty after 2 consecutive incorrect answers
      if (adaptiveState.consecutiveIncorrect >= 2 && adaptiveState.currentDifficulty !== 'Beginner') {
        adaptiveState.currentDifficulty = getNextDifficulty(adaptiveState.currentDifficulty, 'down');
        adaptiveState.difficultyAdjustments = (adaptiveState.difficultyAdjustments || 0) + 1;
        
        // Provide hint for struggling users
        if (adaptiveState.consecutiveIncorrect >= 3) {
          evaluation.hint = await generateHint(question.question, mockInterview.interviewType);
          adaptiveState.hintsProvided = (adaptiveState.hintsProvided || 0) + 1;
          adaptiveState.performancePattern = adaptiveState.performancePattern.concat('hint_used');
        }
      }
    }
    
    // Keep only last 10 performance patterns
    if (adaptiveState.performancePattern && adaptiveState.performancePattern.length > 10) {
      adaptiveState.performancePattern = adaptiveState.performancePattern.slice(-10);
    }
    
    mockInterview.adaptiveState = adaptiveState;

    // Store answer and evaluation with NLP analysis
    mockInterview.userAnswers.push({
      questionIndex,
      question: question.question,
      userAnswer,
      submittedAt: new Date(),
      analysis: analysis || {}
    });

    mockInterview.aiEvaluation.answers.push({
      questionIndex,
      ...evaluation,
      followUpQuestions: followUpQuestions || [],
      sentimentAnalysis,
      evaluatedAt: new Date(),
      confidenceScore: analysis?.confidence?.score || sentimentAnalysis?.confidence || 50
    });

    await mockInterview.save();

    // Send next question or completion
    const nextQuestion = mockInterview.questions[questionIndex + 1];

    res.json({
      success: true,
      evaluation,
      followUpQuestions,
      nextQuestion: nextQuestion ? nextQuestion : null,
      isComplete: !nextQuestion,
      adaptiveInfo: {
        currentDifficulty: adaptiveState.currentDifficulty,
        consecutiveCorrect: adaptiveState.consecutiveCorrect,
        consecutiveIncorrect: adaptiveState.consecutiveIncorrect,
        hintsProvided: adaptiveState.hintsProvided,
        difficultyAdjusted: adaptiveState.difficultyAdjustments > 0
      },
      message: 'Answer evaluated successfully'
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ 
      success: false, 
      message: `Error: ${err.message}`,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Complete mock interview and get overall feedback
router.post('/mock-interview/:interviewId/complete', authOptional, async (req, res) => {
  try {
    if (!req.userId || req.params.interviewId === 'mock-demo') {
      return res.json({
        success: true,
        summary: {
          overallScore: 80,
          readinessScore: 82,
          strengths: ['Communication', 'Problem breakdown'],
          improvements: ['More depth on scaling'],
          nextSteps: ['Practice system design', 'Revise complexity analysis']
        }
      });
    }

    const mockInterview = await MockInterview.findById(req.params.interviewId);

    if (!mockInterview || mockInterview.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Calculate overall scores
    const answers = mockInterview.aiEvaluation.answers;
    const overallScore = answers.reduce((sum, a) => sum + (a.correctness || 0), 0) / answers.length;
    const readinessScore = (overallScore * 0.6) + (answers[0]?.communication || 0) * 0.4;

    // Generate AI summary
    const summaryFeedback = await AIEvaluator.generatePerformanceInsights({
      averageScore: overallScore,
      problemsSolved: answers.length,
      improvementRate: 0,
      weakTopics: []
    });

    mockInterview.aiEvaluation.overallScore = overallScore;
    mockInterview.aiEvaluation.readinessScore = readinessScore;
    mockInterview.aiEvaluation.summaryFeedback = summaryFeedback;
    mockInterview.status = 'Completed';
    mockInterview.completedAt = new Date();

    await mockInterview.save();

    // Update user performance
    await updateUserPerformanceAfterInterview(req.userId, mockInterview);

    res.json({
      success: true,
      interview: mockInterview,
      summary: {
        overallScore,
        readinessScore,
        feedback: summaryFeedback
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== CHAT TUTOR ==============

// Start chat session (RAG-enabled)
router.post('/tutor/chat', auth, async (req, res) => {
  try {
    const { topic, sessionType, message, analysis, tutorMode = 'hint', codeLanguage = 'javascript' } = req.body;
    const userId = req.userId;
    const effectiveTopic = topic || 'General Interview Prep';

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }

    let chatSession = await ChatSession.findOne({ userId, topic: effectiveTopic });

    if (!chatSession) {
      chatSession = new ChatSession({
        userId,
        topic: effectiveTopic,
        sessionType: sessionType || 'doubt-solving',
        messages: []
      });
    }

    const cacheKey = `tutor|${effectiveTopic}|${sessionType}|${tutorMode}|${message}`;

    // Get grounded AI response with retrieval + caching + retry
    let ragResponse = getCache(cacheKey);
    if (!ragResponse) {
      try {
        ragResponse = await withRetry(() =>
          RAGService.askWithRAG({
            message,
            topic: effectiveTopic,
            sessionType: sessionType || 'doubt-solving',
            conversationHistory: chatSession.messages,
            tutorMode,
            codeLanguage
          })
        );
        setCache(cacheKey, ragResponse, 2 * 60 * 1000);
      } catch (aiError) {
        console.error('RAG response error:', aiError);
        // Fallback response
        ragResponse = {
          response: `I had trouble generating a response. Error: ${aiError.message}. Please try again or rephrase your question.`,
          sources: [],
          usedRag: false,
          provider: 'fallback'
        };
      }
    }

    // Store messages with metadata
    chatSession.messages.push(
      {
        sender: 'user',
        message,
        timestamp: new Date(),
        analysis: analysis || {}
      },
      {
        sender: 'ai',
        message: ragResponse.response,
        timestamp: new Date(),
        aiModel: ragResponse.provider || 'unknown'
      }
    );

    await chatSession.save();

    res.json({
      success: true,
      response: ragResponse.response,
      sources: ragResponse.sources || [],
      usedRag: ragResponse.usedRag === true,
      provider: ragResponse.provider || 'unknown',
      tutorMode,
      codeLanguage,
      sessionId: chatSession._id,
      sessionType: chatSession.sessionType
    });
  } catch (err) {
    console.error('Chat tutor route error:', err);
    res.status(500).json({ 
      success: false, 
      message: `Server error: ${err.message}`,
      error: process.env.NODE_ENV === 'development' ? err : undefined
    });
  }
});

// Streaming tutor chat (chunked)
router.post('/tutor/chat/stream', authOptional, async (req, res) => {
  try {
    const { topic, sessionType, message, tutorMode = 'hint', codeLanguage = 'javascript' } = req.body || {};
    const effectiveTopic = topic || 'General Interview Prep';
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const cacheKey = `tutor-stream|${effectiveTopic}|${sessionType}|${tutorMode}|${message}`;
    let ragResponse = getCache(cacheKey);
    if (!ragResponse) {
      ragResponse = await withRetry(() =>
        RAGService.askWithRAG({
          message,
          topic: effectiveTopic,
          sessionType: sessionType || 'doubt-solving',
          conversationHistory: [],
          tutorMode,
          codeLanguage
        })
      );
      setCache(cacheKey, ragResponse, 2 * 60 * 1000);
    }

    const text = ragResponse?.response || 'No response generated.';
    const chunks = text.match(/.{1,160}/g) || [text];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= chunks.length) {
        clearInterval(interval);
        res.write('\n');
        return res.end();
      }
      res.write(chunks[idx]);
      idx += 1;
    }, 60);
  } catch (err) {
    console.error('Tutor stream error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// RAG knowledge base metadata
router.get('/tutor/rag/status', auth, async (req, res) => {
  try {
    const stats = RAGService.getKnowledgeBaseStats();
    res.json({
      success: true,
      rag: {
        enabled: true,
        ...stats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== RESUME ANALYSIS ==============

// Upload resume and parse
router.post('/resume/upload', async (req, res) => {
  try {
    const resumeFile = req.body.resumeData; // Assuming base64 or text data
    
    // Parse resume (simplified - in production use proper parser)
    const parsedResume = await parseResume(resumeFile);
    
    // Generate AI insights
    const aiInsights = await AIEvaluator.generatePerformanceInsights(parsedResume);
    
    // Generate questions
    const generatedQuestions = await AIEvaluator.generateQuestionsFromResume(parsedResume);

    const resumeData = new ResumeData({
      userId: req.userId,
      fileUrl: req.body.fileUrl,
      fileName: req.body.fileName,
      ...parsedResume,
      aiInsights,
      generatedQuestions
    });

    await resumeData.save();

    res.status(201).json({
      success: true,
      resumeData,
      generatedQuestions,
      aiInsights
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== LEARNING PATHS ==============

// Generate personalized learning path
router.post('/learning-path/generate', async (req, res) => {
  try {
    const { targetRole, currentLevel, yearsOfExperience } = req.body;
    
    // Get user performance
    const userPerf = await UserPerformance.findOne({ userId: req.userId });
    
    // Generate path with AI
    const pathData = await AIEvaluator.generateLearningPath(
      { currentLevel, yearsOfExperience },
      targetRole,
      userPerf
    );

    const learningPath = new LearningPath({
      userId: req.userId,
      targetRole,
      currentLevel,
      yearsOfExperience,
      ...pathData
    });

    await learningPath.save();

    res.json({
      success: true,
      learningPath
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get learning path progress
router.get('/learning-path', auth, async (req, res) => {
  try {
    const learningPath = await LearningPath.findOne({ userId: req.userId });
    
    if (!learningPath) {
      return res.status(404).json({ success: false, message: 'No learning path found' });
    }

    res.json({ success: true, learningPath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== PERFORMANCE ANALYTICS ==============

// Get AI-generated insights
router.get('/insights', auth, async (req, res) => {
  try {
    const userPerf = await UserPerformance.findOne({ userId: req.userId });
    
    if (!userPerf) {
      return res.status(404).json({ success: false, message: 'No performance data' });
    }

    res.json({
      success: true,
      insights: {
        overallReadiness: userPerf.overallReadinessScore,
        confidence: userPerf.overallConfidenceScore,
        weakTopics: userPerf.weakTopics,
        strongTopics: userPerf.strongTopics,
        aiInsights: userPerf.aiInsights,
        recommendations: userPerf.categoryPerformance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== HELPER FUNCTIONS ==============

async function generateTechnicalQuestions(targetRole, difficulty, count = 5) {
  // Placeholder - would generate based on role
  return Array.from({ length: count }).map((_, index) => ({
    question: `Technical Question ${index + 1}: Explain a core ${targetRole} concept with example.`,
    category: 'technical',
    difficulty: difficulty || 'Intermediate'
  }));
}

async function generateHRQuestions(targetRole, count = 3) {
  return Array.from({ length: count }).map((_, index) => ({
    question: `HR Question ${index + 1}: Why are you a strong fit for ${targetRole}?`,
    category: 'hr',
    difficulty: 'Beginner'
  }));
}

function evaluateAnswerQuality(questionText, answerText) {
  const normalize = (text = '') =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const stopwords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'and', 'or', 'in', 'on', 'at',
    'with', 'as', 'it', 'this', 'that', 'about', 'your', 'you', 'me', 'my', 'we', 'our', 'be', 'can'
  ]);

  const tokenize = (text = '') =>
    normalize(text)
      .split(' ')
      .filter((word) => word.length > 2 && !stopwords.has(word));

  const questionTokens = new Set(tokenize(questionText));
  const answerTokens = tokenize(answerText);
  const uniqueAnswer = new Set(answerTokens);

  const overlap = [...uniqueAnswer].filter((t) => questionTokens.has(t)).length;
  const overlapRatio = questionTokens.size ? overlap / questionTokens.size : 0;
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < 4) {
    return {
      forceLowScore: true,
      reason: 'Answer is too short. Please provide a detailed response.',
      wordCount,
      overlapRatio
    };
  }

  if (overlapRatio < 0.05) {
    return {
      forceLowScore: true,
      reason: 'Answer appears off-topic for this question.',
      wordCount,
      overlapRatio
    };
  }

  return {
    forceLowScore: false,
    reason: '',
    wordCount,
    overlapRatio
  };
}

function buildLowScoreEvaluation(reason, qualityGate) {
  return {
    correctness: 10,
    relevance: 10,
    communication: 20,
    completeness: 15,
    clarity: 20,
    optimization: 0,
    feedback: reason,
    strengths: [],
    improvements: [
      'State the core idea in 1-2 sentences, then detail it.',
      'Use a concrete example to anchor the concept.',
      'Give time/space complexity or trade-offs.',
      'List one edge case or failure mode.',
      'Organize in steps: approach → details → complexity → edge cases → summary.'
    ],
    isCorrect: false,
    qualityGate
  };
}

function normalizeEvaluation(rawEvaluation, qualityGate) {
  const safe = rawEvaluation && typeof rawEvaluation === 'object' ? rawEvaluation : {};

  const pickNumber = (...values) => {
    for (const value of values) {
      const n = Number(value);
      if (!Number.isNaN(n)) return Math.max(0, Math.min(100, n));
    }
    return 0;
  };

  const normalized = {
    correctness: pickNumber(
      safe.correctness,
      safe.score,
      safe.relevance
    ),
    relevance: pickNumber(
      safe.relevance,
      safe['Relevance Score'],
      safe.correctness
    ),
    communication: pickNumber(
      safe.communication,
      safe['Communication Score'],
      safe.clarity
    ),
    completeness: pickNumber(
      safe.completeness,
      safe['Structure Quality'],
      safe.relevance
    ),
    clarity: pickNumber(
      safe.clarity,
      safe.communication
    ),
    optimization: pickNumber(
      safe.optimization
    ),
    feedback: safe.feedback || 'Answer evaluated.',
    strengths: Array.isArray(safe.strengths) ? safe.strengths : [],
    improvements: Array.isArray(safe.improvements) ? safe.improvements : [],
    qualityGate
  };

  // Derive strengths/improvements if missing or too thin
  const uniquePush = (arr, item) => {
    if (!arr.includes(item)) arr.push(item);
  };

  const strengths = Array.isArray(normalized.strengths) ? [...normalized.strengths] : [];
  const improvements = Array.isArray(normalized.improvements) ? [...normalized.improvements] : [];

  if (normalized.correctness >= 75) uniquePush(strengths, 'Addresses the core ask correctly.');
  if (normalized.relevance >= 75) uniquePush(strengths, 'Stays on-topic with the question.');
  if (normalized.communication >= 75) uniquePush(strengths, 'Clear structure and flow.');
  if (normalized.completeness >= 70) uniquePush(strengths, 'Covers key steps without big gaps.');

  if (normalized.correctness < 70) uniquePush(improvements, 'State the core algorithm/idea explicitly, then justify why it works.');
  if (normalized.communication < 70) uniquePush(improvements, 'Use a 4-part structure: approach → key steps → complexity → edge cases.');
  if (normalized.completeness < 70) uniquePush(improvements, 'Mention at least one edge case and how your solution handles it.');
  if (normalized.relevance < 60) uniquePush(improvements, 'Rephrase the question in your own words to stay aligned, then answer that phrasing.');
  if (normalized.optimization < 50) uniquePush(improvements, 'Discuss trade-offs and potential optimizations (time/space).');
  if (improvements.length === 0) uniquePush(improvements, 'Tighten the answer with one example and a concise complexity statement.');

  normalized.strengths = strengths;
  normalized.improvements = improvements;

  if (qualityGate.forceLowScore) {
    normalized.correctness = Math.min(normalized.correctness || 10, 20);
    normalized.relevance = Math.min(normalized.relevance || 10, 20);
    normalized.feedback = qualityGate.reason;
  }

  // Compose a concise feedback headline
  const avgScore = Math.round(
    (normalized.correctness * 0.45) +
    (normalized.communication * 0.25) +
    (normalized.relevance * 0.2) +
    (normalized.completeness * 0.1)
  );
  const band = avgScore >= 85 ? 'excellent' : avgScore >= 70 ? 'good' : avgScore >= 55 ? 'fair' : 'needs improvement';
  const topFix = normalized.improvements[0] || 'Add more detail.';
  normalized.feedback = normalized.feedback && normalized.feedback !== 'Answer evaluated.'
    ? `${normalized.feedback} | Verdict: ${band.toUpperCase()} (≈${avgScore}). Top fix: ${topFix}`
    : `Verdict: ${band.toUpperCase()} (≈${avgScore}). Top fix: ${topFix}`;

  normalized.isCorrect = normalized.correctness >= 60 && normalized.relevance >= 50 && !qualityGate.forceLowScore;
  return normalized;
}

function normalizeInterviewDifficulty(rawDifficulty) {
  const value = (rawDifficulty || '').toLowerCase();
  if (value === 'easy' || value === 'beginner') return 'Beginner';
  if (value === 'medium' || value === 'intermediate') return 'Intermediate';
  if (value === 'hard' || value === 'advanced') return 'Advanced';
  return 'Intermediate';
}

async function generateBehavioralQuestions(targetRole, count = 3) {
  // Placeholder - would generate based on role
  return Array.from({ length: count }).map((_, index) => ({
    question: `Behavioral Question ${index + 1}: Tell me about a challenge you handled as a ${targetRole}.`,
    category: 'behavioral',
    difficulty: 'Intermediate'
  }));
}

async function updateUserPerformanceAfterInterview(userId, mockInterview) {
  const userPerf = await UserPerformance.findOne({ userId });
  if (userPerf) {
    userPerf.interviewAttempts.push({
      interviewId: mockInterview._id,
      date: new Date(),
      type: mockInterview.interviewType,
      roleTarget: mockInterview.targetRole,
      score: mockInterview.aiEvaluation.overallScore,
      readiness: mockInterview.aiEvaluation.readinessScore
    });
    await userPerf.save();
  }
}

async function parseResume(resumeData) {
  // Placeholder - actual implementation would use resume parser library
  return {
    personalInfo: { fullName: 'User' },
    experience: [],
    education: [],
    skills: [],
    projects: []
  };
}

/**
 * Text-to-Speech proxy
 * Expects: { text, voiceId?, lang? }
 * Returns: { audioBase64 }
 */
router.post('/voice/tts', async (req, res) => {
  try {
    const { text, voiceId, lang } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'text is required' });
    }

    // Prefer OpenAI tts if key present, fallback to noop
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({ success: true, audioBase64: null, note: 'OPENAI_API_KEY missing; TTS skipped' });
    }

    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: voiceId || 'alloy',
        input: text,
        format: 'mp3',
        language: lang || 'en'
      })
    });

    if (!resp.ok) {
      console.error('TTS response not ok', await resp.text());
      return res.status(500).json({ success: false, error: 'tts_failed' });
    }

    const audioBuffer = Buffer.from(await resp.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');
    res.json({ success: true, audioBase64, contentType: 'audio/mpeg' });
  } catch (err) {
    console.error('TTS failed', err);
    res.status(500).json({ success: false, error: 'tts_failed' });
  }
});

/**
 * Translation + grammar correction
 * Expects: { text, sourceLang?, targetLang }
 */
router.post('/voice/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'auto', targetLang = 'en' } = req.body || {};
    if (!text) return res.status(400).json({ success: false, error: 'text is required' });
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({ success: true, translated: text, corrected: text, note: 'OPENAI_API_KEY missing; passthrough' });
    }

    const prompt = [
      'You are a concise translator and grammar corrector.',
      `Source language: ${sourceLang}`,
      `Target language: ${targetLang}`,
      'Return JSON with keys "translated" and "corrected".',
      'Corrected keeps original language but fixes grammar; translated is in target language.'
    ].join('\n');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!resp.ok) {
      console.error('Translate resp not ok', await resp.text());
      return res.status(500).json({ success: false, error: 'translate_failed' });
    }

    const data = await resp.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    res.json({ success: true, translated: parsed.translated, corrected: parsed.corrected });
  } catch (err) {
    console.error('Translate failed', err);
    res.status(500).json({ success: false, error: 'translate_failed' });
  }
});

/**
 * ATS scoring and missing-keyword detection
 * Expects: { resumeText, role }
 */
router.post('/resume/ats-score', async (req, res) => {
  try {
    const { resumeText = '', role = 'Software Engineer' } = req.body || {};
    if (!resumeText.trim()) return res.status(400).json({ success: false, error: 'resumeText required' });

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        success: true,
        atsScore: 60,
        missingKeywords: [],
        strengths: [],
        risks: [],
        note: 'OPENAI_API_KEY missing; static score returned'
      });
    }

    const prompt = [
      'You are an ATS scoring engine for tech resumes.',
      `Target role: ${role}`,
      'Return JSON with keys: atsScore (0-100), missingKeywords (array), strengths (array), risks (array).',
      'Focus on hard skills, impact, seniority signals.'
    ].join('\n');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: resumeText }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!resp.ok) {
      console.error('ATS resp not ok', await resp.text());
      return res.status(500).json({ success: false, error: 'ats_failed' });
    }

    const data = await resp.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('ATS score error', err);
    res.status(500).json({ success: false, error: 'ats_failed' });
  }
});

/**
 * Generate interview questions based on resume
 * Expects: { resumeText, role }
 */
router.post('/resume/questions', async (req, res) => {
  try {
    const { resumeText = '', role = 'Software Engineer' } = req.body || {};
    if (!resumeText.trim()) return res.status(400).json({ success: false, error: 'resumeText required' });

    if (!process.env.OPENAI_API_KEY) {
      return res.json({ success: true, questions: [] });
    }

    const prompt = [
      'Generate 8 targeted interview questions based on this resume.',
      'Include mix of: system design (if senior), DSA/problem solving, behavioral STAR follow-ups, and project deep-dives.',
      `Target role: ${role}`,
      'Return JSON array of strings.'
    ].join('\n');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: resumeText }
        ],
        response_format: { type: 'json_array' }
      })
    });

    if (!resp.ok) {
      console.error('Resume questions resp not ok', await resp.text());
      return res.status(500).json({ success: false, error: 'resume_questions_failed' });
    }

    const data = await resp.json();
    const questions = JSON.parse(data.choices?.[0]?.message?.content || '[]');
    res.json({ success: true, questions });
  } catch (err) {
    console.error('Resume questions error', err);
    res.status(500).json({ success: false, error: 'resume_questions_failed' });
  }
});

/**
 * Learning path generator (30-day)
 * Expects: { role, experience, goal, hoursPerDay }
 */
router.post('/learning-path', async (req, res) => {
  try {
    const { role = 'Software Engineer', experience = 'junior', goal = 'ace interviews', hoursPerDay = 2 } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        success: true,
        plan: [],
        checkpoints: [],
        note: 'OPENAI_API_KEY missing; empty plan returned'
      });
    }

    const prompt = [
      'Create a 30-day interview prep roadmap.',
      `Role: ${role}, Experience: ${experience}, Goal: ${goal}, Hours per day: ${hoursPerDay}`,
      'Each day should have topics[], practice[], resources[]. Add weekly checkpoints.',
      'Return JSON with keys: plan (array of days), checkpoints (array).'
    ].join('\n');

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!resp.ok) {
      console.error('Learning path resp not ok', await resp.text());
      return res.status(500).json({ success: false, error: 'learning_path_failed' });
    }

    const data = await resp.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error('Learning path error', err);
    res.status(500).json({ success: false, error: 'learning_path_failed' });
  }
});

/**
 * Body language analysis placeholder
 * Expects: { eyeContact?, smileRate?, fidgetScore? } or future video frames
 */
router.post('/body-language/analyze', async (req, res) => {
  try {
    // Placeholder: in prod, run MediaPipe/TF model server-side or accept client metrics
    const { eyeContact = null, smileRate = null, fidgetScore = null } = req.body || {};
    const result = {
      eyeContact: eyeContact ?? 0.65,
      smileRate: smileRate ?? 0.35,
      fidgetScore: fidgetScore ?? 0.4,
      confidence: Number(((eyeContact ?? 0.65) * 0.5 + (1 - (fidgetScore ?? 0.4)) * 0.5)).toFixed(2)
    };
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Body language analyze error', err);
    res.status(500).json({ success: false, error: 'body_language_failed' });
  }
});


/**
 * AI-Based Skill Gap Analysis
 */
router.get('/skill-gap-analysis/:userId?', authOptional, async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    // Get user's performance data
    const userPerformance = await UserPerformance.findOne({ userId });
    const recentInterviews = await MockInterview.find({ userId })
      .sort({ completedAt: -1 })
      .limit(10);

    if (!userPerformance && recentInterviews.length === 0) {
      return res.json({
        success: true,
        skillGaps: {
          weak: [],
          average: [],
          strong: []
        },
        recommendations: ['Complete your first mock interview to get personalized analysis'],
        industryComparison: {}
      });
    }

    // Analyze skill gaps
    const skillAnalysis = await analyzeSkillGaps(userPerformance, recentInterviews);
    
    // Generate improvement plan
    const improvementPlan = await generateImprovementPlan(skillAnalysis);

    res.json({
      success: true,
      skillGaps: skillAnalysis,
      recommendations: improvementPlan,
      industryComparison: await getIndustryBenchmarks(userPerformance?.categoryPerformance || {})
    });
  } catch (err) {
    console.error('Skill gap analysis error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * AI Knowledge Graph for Topics
 */
router.get('/knowledge-graph', authOptional, async (req, res) => {
  try {
    const { category, difficulty, topic } = req.query;
    
    let query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = new RegExp(topic, 'i');
    
    const topics = await KnowledgeGraph.find(query)
      .select('topic category difficulty prerequisites dependentTopics relatedTopics userPerformance')
      .sort({ 'aiInsights.recommendedOrder': 1 });
    
    res.json({ success: true, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get learning path for a weak topic
router.get('/knowledge-graph/:topicId/learning-path', authOptional, async (req, res) => {
  try {
    const topic = await KnowledgeGraph.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    
    // Generate personalized learning path
    const learningPath = await generateTopicLearningPath(topic, req.userId);
    
    res.json({ success: true, data: learningPath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get topic recommendations based on user performance
router.get('/knowledge-graph/recommendations/:userId?', authOptional, async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }
    
    const userPerformance = await UserPerformance.findOne({ userId });
    const recommendations = await generateTopicRecommendations(userPerformance);
    
    res.json({ success: true, data: recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * AI Explanation Generator
 */
router.post('/explain-concept', authOptional, async (req, res) => {
  try {
    const { concept, context, level = 'intermediate' } = req.body;
    
    if (!concept) {
      return res.status(400).json({ success: false, message: 'Concept is required' });
    }

    const explanations = await generateMultiLevelExplanation(concept, context, level);
    
    res.json({ success: true, explanations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate explanation after wrong answer
router.post('/explain-mistake', authOptional, async (req, res) => {
  try {
    const { question, userAnswer, correctApproach } = req.body;
    
    const explanation = await generateMistakeExplanation(question, userAnswer, correctApproach);
    
    res.json({ success: true, explanation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Project-Based Interview Simulation
 */
router.post('/project-interview/start', authOptional, async (req, res) => {
  try {
    const { projectType, difficulty } = req.body;
    
    // Generate project interview structure
    const projectStructure = await generateProjectInterview(projectType, difficulty);
    
    const projectInterview = new ProjectInterview({
      userId: req.userId || null,
      projectType,
      projectTitle: projectStructure.title,
      projectDescription: projectStructure.description,
      phases: projectStructure.phases,
      difficulty: difficulty || 'Intermediate'
    });
    
    if (req.userId) {
      await projectInterview.save();
    }
    
    res.json({
      success: true,
      projectId: req.userId ? projectInterview._id : 'demo-project',
      project: projectStructure,
      message: 'Project interview started'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

function getNextDifficulty(currentDifficulty, direction) {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const currentIndex = levels.indexOf(currentDifficulty);
  
  if (direction === 'up' && currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  } else if (direction === 'down' && currentIndex > 0) {
    return levels[currentIndex - 1];
  }
  
  return currentDifficulty;
}

async function generateHint(questionText, interviewType) {
  try {
    const prompt = `Generate a helpful hint for this ${interviewType} interview question without giving away the full answer. Keep it brief and encouraging.

Question: ${questionText}

Hint:`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 100
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Consider breaking down the problem into smaller parts.';
    }
  } catch (err) {
    console.error('Hint generation error:', err);
  }
  
  // Fallback hints
  if (interviewType === 'technical') {
    return 'Think about the time and space complexity of your solution.';
  } else if (interviewType === 'behavioral') {
    return 'Use the STAR method: Situation, Task, Action, Result.';
  }
  
  return 'Take a deep breath and think step by step.';
}

/**
 * AI-Based Interview Prediction Score
 */
router.get('/interview-prediction/:interviewId', authOptional, async (req, res) => {
  try {
    const mockInterview = await MockInterview.findById(req.params.interviewId);
    
    if (!mockInterview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (req.userId && mockInterview.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Generate prediction report
    const predictionReport = await generatePredictionReport(mockInterview);
    
    res.json({
      success: true,
      predictionReport
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Skill Gap Analysis Helper Functions
 */
async function analyzeSkillGaps(userPerformance, recentInterviews) {
  const skillScores = {};
  
  // Analyze from user performance
  if (userPerformance) {
    Object.keys(userPerformance.categoryPerformance).forEach(category => {
      const perf = userPerformance.categoryPerformance[category];
      skillScores[category] = perf.averageScore || 0;
    });
  }
  
  // Analyze from recent interviews
  recentInterviews.forEach(interview => {
    if (interview.aiEvaluation?.answers) {
      interview.aiEvaluation.answers.forEach(answer => {
        const category = interview.interviewType;
        if (!skillScores[category]) skillScores[category] = [];
        skillScores[category].push(answer.correctness || 0);
      });
    }
  });
  
  // Calculate averages
  Object.keys(skillScores).forEach(category => {
    if (Array.isArray(skillScores[category])) {
      skillScores[category] = skillScores[category].reduce((a, b) => a + b, 0) / skillScores[category].length;
    }
  });
  
  // Categorize skills
  const weak = [];
  const average = [];
  const strong = [];
  
  Object.entries(skillScores).forEach(([skill, score]) => {
    if (score < 60) weak.push({ skill, score: Math.round(score) });
    else if (score < 80) average.push({ skill, score: Math.round(score) });
    else strong.push({ skill, score: Math.round(score) });
  });
  
  return { weak, average, strong };
}

async function generateImprovementPlan(skillAnalysis) {
  const recommendations = [];
  
  skillAnalysis.weak.forEach(({ skill, score }) => {
    recommendations.push(`Focus on ${skill} fundamentals - current score: ${score}%`);
    recommendations.push(`Practice ${skill} questions daily for 30 minutes`);
  });
  
  skillAnalysis.average.forEach(({ skill }) => {
    recommendations.push(`Deepen ${skill} knowledge with advanced problems`);
  });
  
  skillAnalysis.strong.forEach(({ skill }) => {
    recommendations.push(`Mentor others in ${skill} and explore related technologies`);
  });
  
  // Add general recommendations
  if (skillAnalysis.weak.length > 0) {
    recommendations.push('Consider taking online courses for weak areas');
    recommendations.push('Join study groups for peer learning');
  }
  
  return recommendations.slice(0, 10); // Limit to 10 recommendations
}

async function getIndustryBenchmarks(userPerformance) {
  // Mock industry benchmarks - in real app, this would come from a database
  const benchmarks = {
    technical: 75,
    behavioral: 70,
    coding: 72,
    hr: 68
  };
  
  const comparison = {};
  Object.keys(userPerformance).forEach(category => {
    const userScore = userPerformance[category]?.averageScore || 0;
    const benchmark = benchmarks[category] || 70;
    comparison[category] = {
      userScore: Math.round(userScore),
      benchmark,
      difference: Math.round(userScore - benchmark),
      status: userScore >= benchmark ? 'above' : 'below'
    };
  });
  
  return comparison;
}

/**
 * Knowledge Graph Helper Functions
 */
async function generateTopicLearningPath(topic, userId) {
  const learningPath = {
    topic: topic.topic,
    category: topic.category,
    difficulty: topic.difficulty,
    steps: []
  };
  
  // Add prerequisite learning
  if (topic.prerequisites && topic.prerequisites.length > 0) {
    learningPath.steps.push({
      type: 'prerequisites',
      title: 'Master Prerequisites',
      topics: topic.prerequisites.map(p => p.topic),
      estimatedTime: topic.prerequisites.length * 30 // 30 min per prerequisite
    });
  }
  
  // Add core topic learning
  learningPath.steps.push({
    type: 'core',
    title: `Learn ${topic.topic}`,
    resources: topic.resources || [],
    estimatedTime: 60
  });
  
  // Add practice exercises
  learningPath.steps.push({
    type: 'practice',
    title: 'Practice Problems',
    count: 5,
    estimatedTime: 90
  });
  
  // Add related topics
  if (topic.relatedTopics && topic.relatedTopics.length > 0) {
    learningPath.steps.push({
      type: 'related',
      title: 'Explore Related Topics',
      topics: topic.relatedTopics.slice(0, 3).map(r => r.topic),
      estimatedTime: 45
    });
  }
  
  // Add assessment
  learningPath.steps.push({
    type: 'assessment',
    title: 'Take Assessment',
    estimatedTime: 30
  });
  
  return learningPath;
}

async function generateTopicRecommendations(userPerformance) {
  if (!userPerformance) {
    // Default recommendations for new users
    return {
      weakTopics: ['Arrays', 'Strings', 'Basic Algorithms'],
      recommendedPath: ['Data Structures', 'Algorithms', 'System Design'],
      nextSteps: [
        'Start with Array problems',
        'Practice String manipulation',
        'Learn basic sorting algorithms'
      ]
    };
  }
  
  const weakTopics = [];
  
  // Analyze weak areas from performance data
  Object.entries(userPerformance.categoryPerformance).forEach(([category, perf]) => {
    if (perf.averageScore < 70) {
      weakTopics.push({
        category,
        score: perf.averageScore,
        weakTopics: perf.weakTopics || []
      });
    }
  });
  
  // Generate personalized recommendations
  const recommendations = {
    weakTopics: weakTopics.flatMap(w => w.weakTopics),
    recommendedPath: generateRecommendedPath(weakTopics),
    nextSteps: generateNextSteps(weakTopics),
    estimatedTime: calculateEstimatedTime(weakTopics)
  };
  
  return recommendations;
}

function generateRecommendedPath(weakTopics) {
  const pathOrder = {
    technical: ['algorithms', 'data-structures', 'system-design'],
    behavioral: ['communication', 'leadership', 'teamwork'],
    coding: ['syntax', 'logic', 'optimization']
  };
  
  const categories = weakTopics.map(w => w.category);
  const recommended = [];
  
  categories.forEach(category => {
    if (pathOrder[category]) {
      recommended.push(...pathOrder[category]);
    }
  });
  
  return [...new Set(recommended)]; // Remove duplicates
}

function generateNextSteps(weakTopics) {
  const steps = [];
  
  weakTopics.forEach(({ category, weakTopics: topics }) => {
    if (category === 'technical' && topics.includes('Binary Trees')) {
      steps.push('Focus on Tree traversals and recursion');
      steps.push('Practice Binary Search Tree operations');
    } else if (category === 'coding') {
      steps.push('Review time/space complexity analysis');
      steps.push('Practice optimization techniques');
    } else if (category === 'behavioral') {
      steps.push('Practice STAR method for answers');
      steps.push('Work on communication clarity');
    }
  });
  
  if (steps.length === 0) {
    steps.push('Continue practicing current skills');
    steps.push('Explore advanced topics');
  }
  
  return steps;
}

function calculateEstimatedTime(weakTopics) {
  const baseTime = 30; // minutes per weak topic
  return weakTopics.reduce((total, topic) => {
    return total + (topic.weakTopics?.length || 1) * baseTime;
  }, 0);
}

/**
 * AI Explanation Generator Helper Functions
 */
async function generateMultiLevelExplanation(concept, context, primaryLevel) {
  const levels = ['simple', 'intermediate', 'advanced'];
  const explanations = {};
  
  for (const level of levels) {
    try {
      const prompt = `
        Explain the concept "${concept}" in ${level} terms.
        ${context ? `Context: ${context}` : ''}
        
        ${level === 'simple' ? 
          'Use basic language, avoid jargon, explain like to a beginner.' :
          level === 'intermediate' ? 
          'Use some technical terms but explain them, suitable for someone with basic knowledge.' :
          'Use advanced technical language, assume strong background knowledge.'
        }
        
        Include:
        1. What it is
        2. Why it matters
        3. How it works (with examples)
        4. Real-world applications
        5. Common pitfalls to avoid
        
        Keep the explanation clear and educational.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 600
        })
      });

      if (response.ok) {
        const data = await response.json();
        explanations[level] = data.choices?.[0]?.message?.content?.trim() || `Explanation for ${concept} at ${level} level.`;
      }
    } catch (err) {
      console.error(`Explanation generation error for ${level}:`, err);
      explanations[level] = generateFallbackExplanation(concept, level);
    }
  }
  
  return explanations;
}

async function generateMistakeExplanation(question, userAnswer, correctApproach) {
  try {
    const prompt = `
      Analyze this wrong answer and explain the mistake:
      
      QUESTION: ${question}
      USER'S INCORRECT ANSWER: ${userAnswer}
      ${correctApproach ? `CORRECT APPROACH: ${correctApproach}` : ''}
      
      Provide:
      1. What was wrong with the answer
      2. Why the correct approach is better
      3. Key concept that was missed
      4. How to think about this differently
      5. Similar problems to practice
      
      Be encouraging and educational.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 500
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim();
    }
  } catch (err) {
    console.error('Mistake explanation error:', err);
  }
  
  // Fallback explanation
  return `Your answer shows you're thinking about the problem, but let's break it down:

**What could be improved:**
- Consider edge cases and constraints
- Think about efficiency and scalability
- Structure your solution step by step

**Key takeaway:** ${question.includes('design') ? 'Design problems require considering trade-offs between time, space, and functionality.' : 'Technical problems often have multiple approaches - choose based on requirements.'}

Keep practicing - you're getting better with each attempt!`;
}

function generateFallbackExplanation(concept, level) {
  const explanations = {
    simple: {
      'Binary Trees': `A binary tree is like a family tree where each person can have at most 2 children. It's a way to organize data where each piece of information (node) connects to at most two others. Trees help computers find things quickly, like looking up a word in a dictionary.`,
      
      'Recursion': `Recursion is when a function calls itself to solve a problem. It's like solving a puzzle by breaking it into smaller, similar puzzles. For example, to count the leaves on a tree, you count the leaves on each branch, and each branch does the same for its sub-branches.`,
      
      'Dynamic Programming': `Dynamic programming is a smart way to solve complex problems by breaking them into smaller problems and remembering the solutions to avoid repeating work. It's like having a cheat sheet for math problems you've already solved.`
    },
    
    intermediate: {
      'Binary Trees': `Binary trees are hierarchical data structures where each node has at most two children. They're used for efficient searching (O(log n) time), sorting, and representing hierarchical relationships. Common operations include traversal (inorder, preorder, postorder) and balancing for optimal performance.`,
      
      'Recursion': `Recursion solves problems by having functions call themselves with smaller inputs until reaching a base case. It uses the call stack for state management. Key considerations: base cases, recursive cases, and stack overflow prevention. Often more elegant than iterative solutions but can be less efficient.`,
      
      'Dynamic Programming': `DP solves optimization problems by combining solutions to subproblems. Uses memoization or tabulation to store intermediate results. Key: optimal substructure and overlapping subproblems. Examples: Fibonacci with memoization, knapsack problem, longest common subsequence.`
    },
    
    advanced: {
      'Binary Trees': `Binary trees provide O(log n) average-case complexity for search/insert/delete operations. Self-balancing variants (AVL, Red-Black) maintain height invariants. B-trees extend to disk-based storage. Applications in databases, file systems, and compiler design. Complexity analysis considers worst-case scenarios and amortization.`,
      
      'Recursion': `Recursive algorithms leverage the call stack for implicit state management. Tail recursion optimization prevents stack growth. Mutual recursion and co-recursion enable complex state machines. Analysis involves recurrence relations and master theorem. Functional programming paradigms heavily utilize recursion for immutability.`,
      
      'Dynamic Programming': `DP exploits optimal substructure and overlapping subproblems. Bottom-up tabulation avoids recursion overhead. Space-optimized variants reduce memory footprint. Advanced techniques: bitmasking for subsets, digit DP, convex hull optimization. Complexity: O(n) space for 1D, O(n²) for 2D problems.`
    }
  };
  
  return explanations[level]?.[concept] || `${concept} is a ${level}-level concept in computer science. ${level === 'simple' ? 'It helps solve complex problems efficiently.' : level === 'intermediate' ? 'It requires understanding fundamental principles and trade-offs.' : 'It involves advanced algorithmic techniques and optimization strategies.'}`;
}

/**
 * Project-Based Interview Helper Functions
 */
async function generateProjectInterview(projectType, difficulty) {
  const projects = {
    'system-design': {
      title: 'Design Instagram Backend',
      description: 'Design a scalable backend system for a social media platform similar to Instagram, handling millions of users, posts, and interactions.',
      phases: [
        {
          phaseName: 'Requirements Gathering',
          questions: [
            {
              question: 'What are the key functional requirements for this system?',
              category: 'requirements',
              difficulty: 'Intermediate',
              expectedDuration: 10,
              evaluationCriteria: ['Completeness', 'Prioritization', 'Feasibility']
            },
            {
              question: 'What are the non-functional requirements (scalability, availability, etc.)?',
              category: 'requirements',
              difficulty: 'Advanced',
              expectedDuration: 8,
              evaluationCriteria: ['Technical depth', 'Real-world considerations']
            }
          ]
        },
        {
          phaseName: 'High-Level Design',
          questions: [
            {
              question: 'Design the overall system architecture. What are the main components?',
              category: 'architecture',
              difficulty: 'Advanced',
              expectedDuration: 15,
              evaluationCriteria: ['Component identification', 'Data flow', 'Separation of concerns']
            },
            {
              question: 'How would you handle user authentication and authorization?',
              category: 'design',
              difficulty: 'Intermediate',
              expectedDuration: 10,
              evaluationCriteria: ['Security considerations', 'Scalability', 'User experience']
            }
          ]
        },
        {
          phaseName: 'Database Design',
          questions: [
            {
              question: 'Design the database schema for posts, users, and relationships.',
              category: 'design',
              difficulty: 'Advanced',
              expectedDuration: 12,
              evaluationCriteria: ['Normalization', 'Indexing strategy', 'Query optimization']
            }
          ]
        },
        {
          phaseName: 'Scalability & Trade-offs',
          questions: [
            {
              question: 'How would you handle 1 billion daily active users?',
              category: 'scalability',
              difficulty: 'Advanced',
              expectedDuration: 15,
              evaluationCriteria: ['Scaling strategies', 'Bottleneck identification', 'Cost considerations']
            }
          ]
        }
      ]
    },
    
    'ml-fraud-detection': {
      title: 'Build ML Fraud Detection System',
      description: 'Design and implement a machine learning system to detect fraudulent transactions in real-time.',
      phases: [
        {
          phaseName: 'Problem Understanding',
          questions: [
            {
              question: 'What are the key challenges in fraud detection?',
              category: 'requirements',
              difficulty: 'Intermediate',
              expectedDuration: 8
            }
          ]
        },
        {
          phaseName: 'Data Architecture',
          questions: [
            {
              question: 'Design the data pipeline for real-time fraud detection.',
              category: 'architecture',
              difficulty: 'Advanced',
              expectedDuration: 15
            }
          ]
        }
      ]
    }
  };
  
  return projects[projectType] || projects['system-design'];
}

async function evaluateProjectResponse(question, response) {
  try {
    const prompt = `
      Evaluate this response to a system design interview question:
      
      QUESTION: ${question.question}
      CATEGORY: ${question.category}
      EXPECTED DURATION: ${question.expectedDuration} minutes
      
      USER RESPONSE: ${response}
      
      EVALUATION CRITERIA: ${question.evaluationCriteria?.join(', ')}
      
      Provide:
      1. Score (0-100)
      2. Key strengths
      3. Areas for improvement
      4. Specific feedback
      5. Follow-up questions or clarifications needed
      
      Respond in JSON format.
    `;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 400
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      return JSON.parse(data.choices?.[0]?.message?.content || '{}');
    }
  } catch (err) {
    console.error('Project evaluation error:', err);
  }
  
  // Fallback evaluation
  return {
    score: 75,
    strengths: ['Good understanding of core concepts', 'Clear communication'],
    improvements: ['Add more technical details', 'Consider edge cases'],
    feedback: 'Solid response with room for more depth in technical implementation.',
    followUpQuestions: ['How would you handle failures?', 'What metrics would you track?']
  };
}

function getNextProjectQuestion(projectInterview, phaseIndex, questionIndex) {
  const currentPhase = projectInterview.phases[phaseIndex];
  const nextQuestionIndex = questionIndex + 1;
  
  if (nextQuestionIndex < currentPhase.questions.length) {
    return currentPhase.questions[nextQuestionIndex];
  }
  
  // Move to next phase
  const nextPhaseIndex = phaseIndex + 1;
  if (nextPhaseIndex < projectInterview.phases.length) {
    const nextPhase = projectInterview.phases[nextPhaseIndex];
    if (nextPhase.questions && nextPhase.questions.length > 0) {
      return nextPhase.questions[0];
    }
  }
  
  return null; // Interview complete
}

async function generateProjectFinalEvaluation(projectInterview) {
  // Calculate scores based on responses
  const responses = projectInterview.responses;
  const phases = projectInterview.phases;
  
  let totalScore = 0;
  const phaseScores = [];
  
  phases.forEach((phase, phaseIndex) => {
    const phaseResponses = responses.filter(r => r.phaseIndex === phaseIndex);
    const phaseScore = phaseResponses.length > 0 ? 
      phaseResponses.reduce((sum, r) => sum + (r.score || 75), 0) / phaseResponses.length : 0;
    
    phaseScores.push({
      phaseIndex,
      score: Math.round(phaseScore),
      feedback: `Phase ${phaseIndex + 1} completed with ${phaseResponses.length} responses.`
    });
    
    totalScore += phaseScore;
  });
  
  const overallScore = Math.round(totalScore / phases.length);
  
  return {
    overallScore,
    phaseScores,
    technicalCompetence: Math.round(overallScore * 0.9),
    systemThinking: Math.round(overallScore * 0.85),
    communicationClarity: Math.round(overallScore * 0.8),
    summaryFeedback: generateProjectSummaryFeedback(overallScore),
    recommendedFocusAreas: getRecommendedFocusAreas(overallScore, projectInterview.projectType)
  };
}

function generateProjectSummaryFeedback(score) {
  if (score >= 90) {
    return 'Excellent system design skills. You demonstrated strong technical leadership and architectural thinking.';
  } else if (score >= 80) {
    return 'Strong performance with good understanding of scalable system design principles.';
  } else if (score >= 70) {
    return 'Good foundation in system design. Focus on deepening technical expertise and trade-off analysis.';
  } else {
    return 'Developing system design skills. Consider studying more architectural patterns and scalability concepts.';
  }
}

function getRecommendedFocusAreas(score, projectType) {
  const areas = [];
  
  if (score < 80) {
    areas.push('Scalability patterns', 'Database design', 'API design');
  }
  
  if (projectType === 'system-design') {
    areas.push('Distributed systems', 'Caching strategies', 'Load balancing');
  } else if (projectType === 'ml-fraud-detection') {
    areas.push('Real-time processing', 'ML model deployment', 'Feature engineering');
  }
  
  return areas.slice(0, 3);
}

/**
 * Interview Prediction Score Helper Functions
 */
async function generatePredictionReport(mockInterview) {
  const evaluation = mockInterview.aiEvaluation;
  
  if (!evaluation || !evaluation.answers || evaluation.answers.length === 0) {
    return {
      technicalScore: 0,
      communicationScore: 0,
      confidenceScore: 0,
      hiringProbability: 0,
      summary: 'Insufficient data for prediction',
      recommendations: ['Complete more interview questions for accurate assessment']
    };
  }
  
  // Calculate component scores
  const answers = evaluation.answers;
  const technicalScore = calculateAverageScore(answers, 'correctness');
  const communicationScore = calculateAverageScore(answers, 'communication');
  const confidenceScore = calculateAverageScore(answers, 'confidence');
  
  // Calculate hiring probability using weighted formula
  const hiringProbability = calculateHiringProbability(technicalScore, communicationScore, confidenceScore);
  
  // Generate summary and recommendations
  const summary = generatePredictionSummary(hiringProbability);
  const recommendations = generatePredictionRecommendations(hiringProbability, technicalScore, communicationScore, confidenceScore);
  
  return {
    technicalScore: Math.round(technicalScore),
    communicationScore: Math.round(communicationScore),
    confidenceScore: Math.round(confidenceScore),
    hiringProbability: Math.round(hiringProbability),
    summary,
    recommendations,
    detailedBreakdown: {
      strengths: identifyStrengths(answers),
      weaknesses: identifyWeaknesses(answers),
      improvementAreas: getImprovementAreas(answers)
    }
  };
}

function calculateAverageScore(answers, metric) {
  const scores = answers
    .map(answer => answer[metric] || 0)
    .filter(score => score > 0);
  
  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
}

function calculateHiringProbability(technical, communication, confidence) {
  // Weighted formula based on industry standards
  // Technical: 50%, Communication: 30%, Confidence: 20%
  const weightedScore = (technical * 0.5) + (communication * 0.3) + (confidence * 0.2);
  
  // Convert to probability with some randomness to simulate real-world uncertainty
  const baseProbability = Math.min(95, Math.max(5, weightedScore));
  
  // Add realistic variance (±10%)
  const variance = (Math.random() - 0.5) * 20;
  
  return Math.max(0, Math.min(100, baseProbability + variance));
}

function generatePredictionSummary(probability) {
  if (probability >= 80) {
    return 'Excellent performance! You have a very strong chance of success in technical interviews.';
  } else if (probability >= 65) {
    return 'Good performance with strong technical skills. Focus on communication to increase success rate.';
  } else if (probability >= 50) {
    return 'Decent performance but needs improvement in key areas. Continue practicing regularly.';
  } else if (probability >= 30) {
    return 'Below average performance. Significant improvement needed in technical and communication skills.';
  } else {
    return 'Poor performance indicates major gaps in preparation. Consider fundamental review and extensive practice.';
  }
}

function generatePredictionRecommendations(probability, technical, communication, confidence) {
  const recommendations = [];
  
  if (technical < 70) {
    recommendations.push('Strengthen technical fundamentals and problem-solving skills');
    recommendations.push('Practice more coding problems and algorithm challenges');
  }
  
  if (communication < 70) {
    recommendations.push('Improve communication clarity and structure answers better');
    recommendations.push('Practice explaining solutions verbally before writing code');
  }
  
  if (confidence < 70) {
    recommendations.push('Build confidence through regular practice and positive self-talk');
    recommendations.push('Record yourself answering questions to improve delivery');
  }
  
  if (probability < 60) {
    recommendations.push('Consider mock interviews with mentors or peers');
    recommendations.push('Review fundamental concepts and data structures');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue practicing to maintain high performance');
    recommendations.push('Explore advanced topics and system design');
  }
  
  return recommendations;
}

function identifyStrengths(answers) {
  const strengths = [];
  
  const avgCorrectness = calculateAverageScore(answers, 'correctness');
  const avgCommunication = calculateAverageScore(answers, 'communication');
  const avgConfidence = calculateAverageScore(answers, 'confidence');
  
  if (avgCorrectness >= 80) strengths.push('Strong technical problem-solving skills');
  if (avgCommunication >= 80) strengths.push('Excellent communication and explanation abilities');
  if (avgConfidence >= 80) strengths.push('High confidence and poise under pressure');
  
  return strengths;
}

function identifyWeaknesses(answers) {
  const weaknesses = [];
  
  const avgCorrectness = calculateAverageScore(answers, 'correctness');
  const avgCommunication = calculateAverageScore(answers, 'communication');
  const avgConfidence = calculateAverageScore(answers, 'confidence');
  
  if (avgCorrectness < 60) weaknesses.push('Technical problem-solving needs improvement');
  if (avgCommunication < 60) weaknesses.push('Communication skills require development');
  if (avgConfidence < 60) weaknesses.push('Confidence and delivery need work');
  
  return weaknesses;
}

function getImprovementAreas(answers) {
  // Analyze common improvement themes from feedback
  const improvements = new Set();
  
  answers.forEach(answer => {
    if (answer.improvements) {
      answer.improvements.forEach(improvement => {
        improvements.add(improvement);
      });
    }
  });
  
  return Array.from(improvements).slice(0, 5);
}

/**
 * Fallback Explanation Generator
 */
function generateFallbackExplanation(concept, level) {
  const explanations = {
    simple: {
      'Binary Trees': `A binary tree is like a family tree where each person can have at most 2 children. It's a way to organize data where each piece of information (node) connects to at most two others. Trees help computers find things quickly, like looking up a word in a dictionary.`,
      
      'Recursion': `Recursion is when a function calls itself to solve a problem. It's like solving a puzzle by breaking it into smaller, similar puzzles. For example, to count the leaves on a tree, you count the leaves on each branch, and each branch does the same for its sub-branches.`,
      
      'Dynamic Programming': `Dynamic programming is a smart way to solve complex problems by breaking them into smaller problems and remembering the solutions to avoid repeating work. It's like having a cheat sheet for math problems you've already solved.`
    },
    
    intermediate: {
      'Binary Trees': `Binary trees are hierarchical data structures where each node has at most two children. They're used for efficient searching (O(log n) time), sorting, and representing hierarchical relationships. Common operations include traversal (inorder, preorder, postorder) and balancing for optimal performance.`,
      
      'Recursion': `Recursion solves problems by having functions call themselves with smaller inputs until reaching a base case. It uses the call stack for state management. Key considerations: base cases, recursive cases, and stack overflow prevention. Often more elegant than iterative solutions but can be less efficient.`,
      
      'Dynamic Programming': `DP solves optimization problems by combining solutions to subproblems. Uses memoization or tabulation to store intermediate results. Key: optimal substructure and overlapping subproblems. Examples: Fibonacci with memoization, knapsack problem, longest common subsequence.`
    },
    
    advanced: {
      'Binary Trees': `Binary trees provide O(log n) average-case complexity for search/insert/delete operations. Self-balancing variants (AVL, Red-Black) maintain height invariants. B-trees extend to disk-based storage. Applications in databases, file systems, and compiler design. Complexity analysis considers worst-case scenarios and amortization.`,
      
      'Recursion': `Recursive algorithms leverage the call stack for implicit state management. Tail recursion optimization prevents stack growth. Mutual recursion and co-recursion enable complex state machines. Analysis involves recurrence relations and master theorem. Functional programming paradigms heavily utilize recursion for immutability.`,
      
      'Dynamic Programming': `DP exploits optimal substructure and overlapping subproblems. Bottom-up tabulation avoids recursion overhead. Space-optimized variants reduce memory footprint. Advanced techniques: bitmasking for subsets, digit DP, convex hull optimization. Complexity: O(n) space for 1D, O(n²) for 2D problems.`
    }
  };
  
  return explanations[level]?.[concept] || `${concept} is a ${level}-level concept in computer science. ${level === 'simple' ? 'It helps solve complex problems efficiently.' : level === 'intermediate' ? 'It requires understanding fundamental principles and trade-offs.' : 'It involves advanced algorithmic techniques and optimization strategies.'}`;
}


module.exports = router;
