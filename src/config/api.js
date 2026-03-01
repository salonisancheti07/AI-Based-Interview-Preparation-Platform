// API Configuration
// Centralized configuration for all API endpoints and settings

export const API_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: {
      explanation: 200,
      recommendations: 300,
      mockQuestion: 400,
      evaluation: 400,
      tips: 300
    },
    timeout: 30000 // 30 seconds
  },

  // Backend API Configuration (for future use)
  backend: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    endpoints: {
      auth: '/api/auth',
      questions: '/api/questions',
      results: '/api/results',
      user: '/api/user',
      leaderboard: '/api/leaderboard'
    },
    timeout: 15000 // 15 seconds
  },

  // Feature Flags
  features: {
    aiExplanations: true,
    aiRecommendations: true,
    mockInterviews: true,
    answerEvaluation: true,
    interviewTips: true,
    leaderboard: true,
    analytics: true,
    offline: true // Works offline with cached data
  },

  // Cache Configuration
  cache: {
    questionsTTL: 24 * 60 * 60 * 1000, // 24 hours
    resultsTTL: 60 * 60 * 1000, // 1 hour
    userDataTTL: 30 * 60 * 1000 // 30 minutes
  },

  // Rate Limiting
  rateLimit: {
    maxRequests: 100,
    timeWindow: 60 * 1000 // 1 minute
  },

  // Retry Configuration
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000 // 1 second
  }
};

// Question Categories and Topics
export const CATEGORIES = [
  { id: 'html', name: 'HTML & CSS', icon: '🎨', count: 6 },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', count: 6 },
  { id: 'react', name: 'React', icon: '⚛️', count: 6 },
  { id: 'node', name: 'Node.js', icon: '🟢', count: 6 },
  { id: 'database', name: 'Database', icon: '🗄️', count: 6 },
  { id: 'system-design', name: 'System Design', icon: '🏗️', count: 6 },
  { id: 'dsa', name: 'DSA', icon: '📊', count: 6 }
];

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  Easy: { color: '#10b981', level: 1, icon: '🟢' },
  Medium: { color: '#f59e0b', level: 2, icon: '🟡' },
  Hard: { color: '#ef4444', level: 3, icon: '🔴' }
};

// Performance Metrics
export const PERFORMANCE_LEVELS = {
  Excellent: { min: 85, label: 'Excellent', emoji: '🌟', color: '#10b981' },
  Good: { min: 70, label: 'Good', emoji: '👍', color: '#3b82f6' },
  Average: { min: 50, label: 'Need Practice', emoji: '📚', color: '#f59e0b' },
  Poor: { min: 0, label: 'Keep Learning', emoji: '💪', color: '#ef4444' }
};

// Interview Modes
export const INTERVIEW_MODES = {
  practice: { name: 'Practice', duration: 20, questions: 10 },
  timed: { name: 'Timed', duration: 15, questions: 5 },
  mock: { name: 'Mock Interview', duration: 45, questions: 15 },
  adaptive: { name: 'Adaptive', duration: 30, questions: 'variable' }
};

// User Roles
export const USER_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Scientist',
  'QA Engineer',
  'Product Manager'
];

// Badge Definitions
export const BADGES = [
  { id: 'first-attempt', name: 'First Attempt', emoji: '🎯', description: 'Get 100% on first attempt' },
  { id: 'streak-7', name: '7-Day Streak', emoji: '🔥', description: 'Practice 7 days in a row' },
  { id: 'accuracy-90', name: 'Accuracy Master', emoji: '💯', description: 'Achieve 90% accuracy' },
  { id: 'speed-demon', name: 'Speed Demon', emoji: '⚡', description: 'Complete 5 questions in 10 mins' },
  { id: 'completionist', name: 'Completionist', emoji: '🏆', description: 'Complete all categories' },
  { id: 'top-10', name: 'Top 10', emoji: '🥇', description: 'Reach top 10 in leaderboard' }
];

export default API_CONFIG;
