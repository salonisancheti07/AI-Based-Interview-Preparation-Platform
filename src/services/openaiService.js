// OpenAI API Integration
// To use this, install: npm install openai
// Add your OpenAI API key to .env: VITE_OPENAI_API_KEY=sk-...

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Generate AI explanation for a question
export const generateExplanation = async (question, userAnswer, correctAnswer) => {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return question.explanation;
  }

  try {
    const prompt = `
      Question: ${question.title}
      User's Answer: ${question.options[userAnswer]}
      Correct Answer: ${question.options[correctAnswer]}
      Explanation: ${question.explanation}
      
      Provide a clear, concise explanation of why the answer is correct, in 2-3 sentences.
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert coding interviewer providing clear, concise explanations for interview questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return question.explanation;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return question.explanation;
  }
};

// Generate personalized recommendations based on performance
export const generateRecommendations = async (userScore, userAccuracy, weakAreas) => {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return getDefaultRecommendations(userAccuracy);
  }

  try {
    const prompt = `
      A user scored ${userScore}% on an interview preparation quiz with ${userAccuracy}% accuracy.
      Their weak areas are: ${weakAreas.join(', ')}
      
      Provide 3-4 specific, actionable recommendations to improve their interview preparation (bullet points, concise).
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a career coach helping developers improve their interview skills.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return getDefaultRecommendations(userAccuracy);
    }

    const data = await response.json();
    return data.choices[0].message.content.split('\n').filter(r => r.trim());
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return getDefaultRecommendations(userAccuracy);
  }
};

// Generate mock interview question
export const generateMockQuestion = async (topic) => {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return null;
  }

  try {
    const prompt = `
      Generate a technical interview question about ${topic}.
      Format the response as JSON with this structure:
      {
        "question": "the question text",
        "hint": "a helpful hint",
        "difficulty": "Easy|Medium|Hard",
        "keyPoints": ["point1", "point2", "point3"]
      }
      Only return the JSON, no additional text.
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at generating technical interview questions. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse mock question:', e);
      return null;
    }
  } catch (error) {
    console.error('Error generating mock question:', error);
    return null;
  }
};

// Evaluate user's written answer
export const evaluateAnswer = async (question, userAnswer) => {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return { score: 0, feedback: 'API not configured' };
  }

  try {
    const prompt = `
      Interview Question: ${question}
      User's Answer: ${userAnswer}
      
      Rate this answer on a scale of 1-10 and provide constructive feedback.
      Format response as JSON: {"score": number, "feedback": "string", "improvements": ["item1", "item2"]}
      Only return JSON, no additional text.
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer evaluating candidate responses. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText);
      return { score: 0, feedback: 'Error evaluating answer' };
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse evaluation:', e);
      return { score: 5, feedback: content };
    }
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return { score: 0, feedback: 'Error communicating with AI' };
  }
};

// Get interview tips from AI
export const getInterviewTips = async (topic) => {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return getDefaultTips();
  }

  try {
    const prompt = `
      Provide 5 specific tips for answering interview questions about ${topic}.
      Be concise and practical. Format as a simple list.
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach providing practical tips.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      return getDefaultTips();
    }

    const data = await response.json();
    return data.choices[0].message.content.split('\n').filter(t => t.trim());
  } catch (error) {
    console.error('Error getting interview tips:', error);
    return getDefaultTips();
  }
};

// Default fallback functions
const getDefaultRecommendations = (accuracy) => {
  if (accuracy >= 80) {
    return [
      '✅ Great work! Focus on challenging system design problems',
      '📚 Review advanced patterns and optimization techniques',
      '🎯 Practice mock interviews with senior engineers',
      '💡 Contribute to open source projects'
    ];
  } else if (accuracy >= 60) {
    return [
      '📖 Review fundamental concepts more thoroughly',
      '🔄 Practice similar questions multiple times',
      '🎯 Focus on weak areas identified in your quiz',
      '💬 Join study groups for peer learning'
    ];
  } else {
    return [
      '🆘 Start with basic concepts and build foundations',
      '📚 Use official documentation for core topics',
      '🔁 Repeat practice questions daily',
      '👥 Get a mentor to guide your learning'
    ];
  }
};

const getDefaultTips = () => {
  return [
    '✅ Take time to understand the question thoroughly',
    '🤔 Think aloud to show your problem-solving process',
    '📝 Write clear code with good variable names',
    '🧪 Test your solution with different examples',
    '⚡ Optimize for time and space complexity'
  ];
};

// Check if API is configured
export const isOpenAIConfigured = () => {
  return !!OPENAI_API_KEY;
};
