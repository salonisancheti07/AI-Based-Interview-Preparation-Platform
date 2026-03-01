const axios = require('axios');

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const API_BASE = 'https://api.openai.com/v1';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

class AIEvaluator {
  /**
   * Evaluate coding solution
   */
  static async evaluateCodingSolution(code, problem, testCases) {
    try {
      const prompt = `
        Evaluate this code solution for a coding problem:
        
        PROBLEM: ${problem.title}
        PROBLEM DESCRIPTION: ${problem.description}
        
        USER'S CODE:
        ${code}
        
        TEST CASES:
        ${JSON.stringify(testCases, null, 2)}
        
        Please evaluate and provide:
        1. Correctness Score (0-100)
        2. Code Quality Score (0-100)
        3. Optimization Score (0-100)
        4. Time Complexity Assessment
        5. Space Complexity Assessment
        6. Specific Feedback
        7. Suggestions for Improvement
        8. Similar Approach Tips
        
        Respond in JSON format.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (err) {
      console.error('Code evaluation error:', err);
      return { error: 'Evaluation failed', details: err.message };
    }
  }

  /**
   * Analyze sentiment and emotional tone
   */
  static async analyzeSentiment(text, context = 'interview') {
    try {
      const prompt = `
        Analyze the emotional tone and sentiment in this ${context} response:
        
        TEXT: "${text}"
        
        Please analyze and provide:
        1. Overall Sentiment (positive/negative/neutral)
        2. Confidence Score (0-100) - How confident the person sounds
        3. Hesitation Indicators (0-100) - Signs of uncertainty
        4. Emotional State (calm/anxious/enthusiastic/nervous/confident)
        5. Communication Clarity (0-100)
        6. Stress Detection (0-100) - Signs of interview stress
        7. Tone Analysis (professional/casual/hesitant/assertive)
        8. Key Emotional Indicators Found
        9. Recommendations for Improvement
        
        Respond in JSON format.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (err) {
      console.error('Sentiment analysis error:', err);
      // Fallback analysis
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Fallback sentiment analysis when AI is unavailable
   */
  static fallbackSentimentAnalysis(text) {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based analysis
    const positiveWords = ['confident', 'excited', 'great', 'excellent', 'proud', 'successful', 'love', 'enjoy'];
    const negativeWords = ['nervous', 'worried', 'unsure', 'difficult', 'struggle', 'hard', 'afraid', 'scared'];
    const hesitationWords = ['um', 'uh', 'like', 'sort of', 'kind of', 'maybe', 'perhaps', 'i think', 'probably'];
    
    const positiveCount = positiveWords.reduce((count, word) => count + (lowerText.includes(word) ? 1 : 0), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (lowerText.includes(word) ? 1 : 0), 0);
    const hesitationCount = hesitationWords.reduce((count, word) => count + (lowerText.split(word).length - 1), 0);
    
    const sentiment = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral';
    const confidence = Math.max(0, Math.min(100, 70 - hesitationCount * 5 - negativeCount * 10));
    const hesitation = Math.min(100, hesitationCount * 15);
    const stress = negativeCount * 20 + hesitationCount * 10;
    
    return {
      sentiment,
      confidence: Math.round(confidence),
      hesitation: Math.round(hesitation),
      emotionalState: confidence > 70 ? 'confident' : confidence > 40 ? 'neutral' : 'anxious',
      communicationClarity: Math.round(confidence * 0.8),
      stressDetection: Math.round(Math.min(100, stress)),
      tone: confidence > 60 ? 'assertive' : hesitation > 30 ? 'hesitant' : 'neutral',
      keyIndicators: [
        ...(positiveCount > 0 ? ['Positive language detected'] : []),
        ...(negativeCount > 0 ? ['Signs of nervousness'] : []),
        ...(hesitationCount > 2 ? ['Hesitation patterns'] : [])
      ],
      recommendations: [
        hesitation > 30 ? 'Practice speaking more fluently' : null,
        confidence < 50 ? 'Work on building confidence' : null,
        stress > 40 ? 'Take deep breaths during interviews' : null
      ].filter(Boolean)
    };
  }
  static async evaluateBehavioralAnswer(question, userAnswer) {
    try {
      const prompt = `
        Evaluate this behavioral/HR interview answer:
        
        QUESTION: ${question}
        
        USER'S ANSWER:
        ${userAnswer}
        
        Please evaluate and provide:
        1. Relevance Score (0-100) - How well it answers the question
        2. Confidence Level (0-100) - Tone and conviction
        3. Communication Score (0-100) - Clarity and structure
        4. Grammar & Language (0-100) - Correctness and fluency
        5. Structure Quality (0-100) - Organization (STAR method)
        6. Specific Strengths
        7. Areas for Improvement
        8. Suggested Better Answer Structure
        9. Follow-up Question Suggestion
        
        Respond in JSON format.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (err) {
      console.error('Behavioral evaluation error:', err);
      // Local fallback rubric when OpenAI throttles
      const score = (name, val) => Math.max(0, Math.min(100, Math.round(val)));
      const len = (userAnswer || '').split(/\s+/).filter(Boolean).length;
      const hasSTAR = /situation|task|action|result/i.test(userAnswer);
      const hasNumbers = /\d/.test(userAnswer);
      const actions = (userAnswer.match(/\b(led|built|created|launched|resolved|designed|improved|reduced|increased)\b/gi) || []).length;
      const base = len < 20 ? 40 : len < 80 ? 65 : 78;
      const relevance = base + (hasSTAR ? 10 : 0);
      const communication = base + actions * 2;
      const grammar = base - 5;
      const structure = hasSTAR ? base + 12 : base - 8;
      const feedback = [
        'Fallback grading (offline):',
        hasSTAR ? 'Good: You referenced STAR elements.' : 'Add STAR structure (Situation, Task, Action, Result).',
        actions ? 'Action verbs present.' : 'Use action verbs to describe what you did.',
        hasNumbers ? 'Impact quantified.' : 'Add numbers to show impact.',
        len < 80 ? 'Expand a bit more detail.' : 'Keep it concise.'
      ].join(' ');
      return {
        feedback,
        relevance: score('relevance', relevance),
        confidence: score('confidence', base + actions),
        communication: score('communication', communication),
        grammar: score('grammar', grammar),
        structure: score('structure', structure),
        error: 'Evaluation failed',
        fallback: true,
        details: err.message
      };
    }
  }

  /**
   * Evaluate system design outline
   */
  static async evaluateSystemDesign(scenario, notes) {
    try {
      const prompt = `
        You are a senior system design interviewer. Review the candidate's outline.

        SCENARIO: ${scenario}

        CANDIDATE NOTES:
        ${notes}

        Provide JSON with:
        {
          "overall": 0-100,
          "coverage": 0-100,        // requirements, APIs, data model, scale
          "tradeoffs": 0-100,       // correctness of trade-offs and choices
          "risks": [ "short bullet" ],
          "strengths": [ "short bullet" ],
          "next_steps": [ "short bullet" ]
        }
      `;
      const response = await this.callOpenAI(prompt, { model: 'gpt-4o-mini', maxTokens: 500, temperature: 0.4 });
      return JSON.parse(response);
    } catch (err) {
      console.error('System design eval error:', err);
      // heuristic fallback
      const len = (notes || '').split(/\s+/).filter(Boolean).length;
      const hasApi = /api|endpoint|rest|graphql/i.test(notes || '');
      const hasStorage = /db|database|sql|nosql|cache|redis|s3/i.test(notes || '');
      const hasScale = /scale|load|qps|throughput|latency|partition|shard|replica/i.test(notes || '');
      // If the answer is extremely short, punish heavily
      if (len < 10) {
        return {
          overall: 5,
          coverage: 5,
          tradeoffs: 5,
          strengths: [],
          risks: ['Answer is too short to evaluate. Add requirements, APIs, storage, scaling, and failure modes.'],
          next_steps: [
            'List functional & non-functional requirements.',
            'Propose APIs and high-level architecture.',
            'Describe data model and storage choices.',
            'Explain scaling, caching, queues, and failures.'
          ],
          fallback: true
        };
      }

      const coverage = Math.min(100, 30 + (hasApi ? 20 : 0) + (hasStorage ? 20 : 0) + (hasScale ? 20 : 0) + Math.min(10, Math.floor(len / 30)));
      return {
        overall: Math.max(20, Math.min(85, coverage)),
        coverage,
        tradeoffs: Math.max(20, coverage - 10),
        strengths: [
          hasApi ? 'Mentioned APIs/endpoints.' : 'Add explicit APIs.',
          hasStorage ? 'Considered storage layer.' : 'Specify storage choices.',
          hasScale ? 'Touched on scaling.' : 'Cover scaling & bottlenecks.'
        ],
        risks: [
          len < 80 ? 'Outline is short; add detail.' : 'Clarify consistency and failure handling.'
        ],
        next_steps: [
          'Detail data model and key indexes.',
          'Sketch request flow and component diagram.',
          'Call out cache, queue, and failure modes.'
        ],
        fallback: true
      };
    }
  }

  /**
   * Generate mock interview questions from resume
   */
  static async generateQuestionsFromResume(resumeData) {
    try {
      const prompt = `
        Based on this resume, generate 10 targeted interview questions:
        
        EXPERIENCE: ${resumeData.experience?.map(e => `${e.position} at ${e.company}: ${e.achievements?.join(', ')}`).join('\n')}
        
        SKILLS: ${resumeData.skills?.map(s => s.skillName).join(', ')}
        
        PROJECTS: ${resumeData.projects?.map(p => `${p.projectName}: ${p.description}`).join('\n')}
        
        Please generate questions that are:
        1. Specific to the resume content
        2. Mix of technical and behavioral
        3. Challenging and realistic
        4. Designed to highlight strengths and probe gaps
        
        For each question provide:
        - Question text
        - Type (technical/behavioral/hr)
        - Difficulty (Easy/Medium/Hard)
        - Why this question (relevance to resume)
        - Expected answer points
        
        Respond in JSON array format.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (err) {
      console.error('Resume question generation error:', err);
      return { error: 'Generation failed', details: err.message };
    }
  }

  /**
   * Generate personalized learning path
   */
  static async generateLearningPath(userProfile, targetRole, currentPerformance) {
    try {
      const prompt = `
        Create a personalized learning path for interview preparation:
        
        USER PROFILE:
        - Current Level: ${userProfile.currentLevel}
        - Skills: ${userProfile.skills?.join(', ')}
        - Weak Areas: ${userProfile.weakAreas?.join(', ')}
        - Target Role: ${targetRole}
        
        CURRENT PERFORMANCE:
        - Average Score: ${currentPerformance.averageScore}
        - Weak Topics: ${currentPerformance.weakTopics?.join(', ')}
        - Strong Topics: ${currentPerformance.strongTopics?.join(', ')}
        
        Generate a 4-week learning path with:
        1. Week-by-week breakdown
        2. Daily tasks and goals
        3. Topics to focus on
        4. Estimated hours per topic
        5. Mock interview schedule
        6. Resources and materials
        7. Success metrics
        8. Risk areas and how to address them
        
        Respond in JSON format with detailed structure.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (err) {
      console.error('Learning path generation error:', err);
      return { error: 'Generation failed', details: err.message };
    }
  }

  /**
   * Provide real-time hints for problem solving
   */
  static async provideHint(problem, userAttempt, hintLevel) {
    try {
      const hintPrompts = {
        1: 'Give a high-level hint about the approach without revealing the solution',
        2: 'Provide more specific guidance about the algorithm to use',
        3: 'Give detailed pseudocode or example that guides to solution'
      };

      const prompt = `
        User is solving this problem: ${problem.title}
        
        Problem: ${problem.description}
        
        Their attempt so far: ${userAttempt}
        
        Provide a LEVEL ${hintLevel} HINT (${hintPrompts[hintLevel]}):
        
        Keep the hint concise and helpful without completely solving it.
      `;

      return await this.callOpenAI(prompt);
    } catch (err) {
      console.error('Hint generation error:', err);
      return 'Try thinking about the data structures that could help here.';
    }
  }

  /**
   * Generate follow-up questions
   */
  static async generateFollowUpQuestions(mainQuestion, userAnswer, questionType) {
    try {
      const prompt = `
        Generate 3 follow-up questions for this interview:
        
        ORIGINAL QUESTION: ${mainQuestion}
        USER'S ANSWER: ${userAnswer}
        QUESTION TYPE: ${questionType}
        
        Follow-up questions should:
        1. Probe deeper into the answer
        2. Expose gaps in understanding
        3. Test critical thinking
        4. Be realistic for actual interviews
        
        Return as JSON array with explanation for why each is a good follow-up.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (err) {
      console.error('Follow-up generation error:', err);
      return [];
    }
  }

  /**
   * Analyze performance trends and generate insights
   */
  static async generatePerformanceInsights(userMetrics) {
    try {
      const prompt = `
        Analyze this user's performance and generate insights:
        
        METRICS:
        - Average Score: ${userMetrics.averageScore}
        - Problems Solved: ${userMetrics.problemsSolved}
        - Mock Interviews: ${userMetrics.mockInterviews}
        - Weak Topics: ${userMetrics.weakTopics?.join(', ')}
        - Strong Topics: ${userMetrics.strongTopics?.join(', ')}
        - Days Active: ${userMetrics.daysActive}
        - Improvement Rate: ${userMetrics.improvementRate}%
        
        Provide:
        1. Overall Assessment
        2. Key Strengths
        3. Areas Needing Improvement
        4. Estimated Interview Readiness (%)
        5. Time to Target Level (weeks)
        6. Recommended Focus Areas
        7. Motivation/Encouragement
        8. Next Milestones
        
        Be specific, data-driven, and actionable.
      `;

      const response = await this.callOpenAI(prompt);
      return response;
    } catch (err) {
      console.error('Insights generation error:', err);
      return 'Keep practicing! Your progress is solid.';
    }
  }

  /**
   * AI Chat Tutor - Concept explanation
   */
  static async chatTutor(userMessage, topic, conversationHistory) {
    try {
      const systemPrompt = `
        You are an expert AI Interview Tutor. Your role is to:
        1. Explain concepts clearly and concisely
        2. Adapt to the user's level
        3. Provide code examples when relevant
        4. Ask clarifying questions if needed
        5. Help solve doubts about interview topics
        6. Suggest resources and practice problems
        
        Current Topic: ${topic}
        Keep responses focused, friendly, and educational.
      `;

      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.sender,
          content: msg.message
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await axios.post(`${API_BASE}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
      });

      return response.data.choices[0].message.content;
    } catch (err) {
      console.error('Chat tutor error:', err);
      return 'I encountered an error. Please try again.';
    }
  }

  /**
   * Core API call to OpenAI with retry logic
   */
  static async callOpenAI(prompt, options = {}) {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY or OPENAI_API_KEY environment variable.');
    }

    const config = {
      model: options.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: options.systemPrompt || 'You are an expert interview coach and evaluator.' },
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 800
    };

    let lastError;
    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await axios.post(`${API_BASE}/chat/completions`, config, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });

        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          return response.data.choices[0].message.content;
        }
        throw new Error('Invalid response format from OpenAI');
      } catch (err) {
        lastError = err;
        
        // Don't retry for authentication errors
        if (err.response?.status === 401) {
          throw new Error('Invalid OpenAI API key');
        }

        // Don't retry for invalid requests
        if (err.response?.status === 400) {
          throw new Error('Invalid request to OpenAI');
        }

        // Retry for rate limits and server errors
        if (attempt < RETRY_ATTEMPTS - 1 && (err.response?.status === 429 || err.response?.status >= 500)) {
          const delay = RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    console.error('OpenAI API failed after retries:', lastError);
    if (lastError?.response?.status === 429) {
      throw new Error('OpenAI rate limit hit. Please wait a bit and retry.');
    }
    throw new Error(`OpenAI API error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Detect plagiarism/cheating
   */
  static async detectPlagiarism(submission, previousSubmissions) {
    try {
      const prompt = `
        Check if this submission appears plagiarized:
        
        CURRENT SUBMISSION:
        ${submission}
        
        Compare similarity with patterns and provide:
        1. Similarity Score (0-100)
        2. Likelihood of plagiarism
        3. Suspicious patterns
        4. Recommendation (Approve/Flag/Investigate)
        
        Respond in JSON format.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (err) {
      console.error('Plagiarism detection error:', err);
      return { error: 'Detection failed', severity: 'None' };
    }
  }
}

module.exports = AIEvaluator;
