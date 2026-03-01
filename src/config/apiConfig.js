// Comprehensive API configuration for the interview prep platform

export const API_ENDPOINTS = {
  // Resume Builder
  resume: {
    create: '/resume/create',
    getAll: '/resume',
    getById: (id) => `/resume/${id}`,
    update: (id) => `/resume/${id}`,
    delete: (id) => `/resume/${id}`,
    exportPdf: '/resume/export-pdf',
    exportWord: '/resume/export-word',
  },

  // Interview Report
  report: {
    create: '/interview-report',
    getAll: '/interview-report',
    getById: (id) => `/interview-report/${id}`,
    update: (id) => `/interview-report/${id}`,
    delete: (id) => `/interview-report/${id}`,
    download: (id) => `/interview-report/${id}/download`,
  },

  // Company Prep
  company: {
    getAll: '/company-prep',
    getById: (id) => `/company-prep/${id}`,
    search: '/company-prep/search',
    filter: '/company-prep/filter',
    addExperience: (id) => `/company-prep/${id}/experience`,
    getInterviewProcess: (id) => `/company-prep/${id}/interview-process`,
  },

  // Peer Practice
  peerPractice: {
    create: '/peer-practice/create',
    getAll: '/peer-practice',
    getById: (id) => `/peer-practice/${id}`,
    join: (id) => `/peer-practice/${id}/join`,
    submitAnswer: (id) => `/peer-practice/${id}/submit-answer`,
    submitFeedback: (id) => `/peer-practice/${id}/submit-feedback`,
    endSession: (id) => `/peer-practice/${id}/end`,
    delete: (id) => `/peer-practice/${id}`,
  },

  // Gamification
  gamification: {
    stats: '/gamification/stats',
    badges: '/gamification/badges',
    leaderboard: '/gamification/leaderboard',
    challenges: '/gamification/challenges',
    achievements: '/gamification/achievements',
    awardBadge: '/gamification/award-badge',
    addXP: '/gamification/add-xp',
    completeChallenge: (id) => `/gamification/challenges/${id}/complete`,
    getUserRank: '/gamification/user-rank',
  },

  // Video Recording
  video: {
    upload: '/video-recording/upload',
    getAll: '/video-recording/list',
    getById: (id) => `/video-recording/${id}`,
    delete: (id) => `/video-recording/${id}`,
    addAiReview: (id) => `/video-recording/${id}/ai-review`,
    download: (id) => `/video-recording/${id}/download`,
    share: (id) => `/video-recording/${id}/share`,
  },

  // Interview Notes
  notes: {
    create: '/interview-notes/create',
    getAll: '/interview-notes',
    getById: (id) => `/interview-notes/${id}`,
    update: (id) => `/interview-notes/${id}`,
    delete: (id) => `/interview-notes/${id}`,
    addBookmark: (id) => `/interview-notes/${id}/bookmark`,
    addHighlight: (id) => `/interview-notes/${id}/highlight`,
    search: '/interview-notes/search',
    generateFlashcards: (id) => `/interview-notes/${id}/flashcards`,
  },

  // Question Recommender
  recommender: {
    suggestions: '/question-recommender/suggestions',
    insights: '/question-recommender/insights',
    weakAreas: '/question-recommender/weak-areas',
    spacedRepetition: '/question-recommender/spaced-repetition',
    learningPaths: '/question-recommender/learning-paths',
    update: '/question-recommender/update',
  },

  // Quick Practice
  quickPractice: {
    start: (duration) => `/quick-practice/start/${duration}`,
    submitAnswer: '/quick-practice/submit-answer',
    endSession: '/quick-practice/end-session',
    skip: '/quick-practice/skip',
    history: '/quick-practice/history',
    getStats: '/quick-practice/stats',
  },

  // Progress Export
  progressExport: {
    getAll: '/progress-export',
    generate: '/progress-export/generate',
    download: (id) => `/progress-export/${id}/download`,
    delete: (id) => `/progress-export/${id}`,
    share: (id) => `/progress-export/${id}/share`,
  },

  // Auth
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh',
  },

  // Problems
  problems: {
    getAll: '/problems',
    getById: (id) => `/problems/${id}`,
    search: '/problems/search',
    filter: '/problems/filter',
  },

  // Submissions
  submissions: {
    create: '/submissions',
    getAll: '/submissions',
    getById: (id) => `/submissions/${id}`,
  },

  // Progress
  progress: {
    getAll: '/progress',
    getById: (id) => `/progress/${id}`,
    update: (id) => `/progress/${id}`,
  },

  // AI
  ai: {
    chat: '/ai/chat',
    evaluate: '/ai/evaluate',
    generateInsights: '/ai/insights',
    suggestQuestions: '/ai/suggest-questions',
  },
};

// Response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  RESUME_CREATED: 'Resume created successfully.',
  RESUME_UPDATED: 'Resume updated successfully.',
  RESUME_DELETED: 'Resume deleted successfully.',
  REPORT_GENERATED: 'Report generated successfully.',
  SESSION_STARTED: 'Session started successfully.',
  SESSION_ENDED: 'Session ended successfully.',
  EXPORT_STARTED: 'Export started. Check your email for the file.',
  SAVED_SUCCESSFULLY: 'Saved successfully.',
};

export default API_ENDPOINTS;
