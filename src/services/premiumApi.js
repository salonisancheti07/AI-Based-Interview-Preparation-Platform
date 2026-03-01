import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ==================== RESUME BUILDER API ==================== */
export const resumeApi = {
  create: (resumeData) => apiClient.post('/resume/create', resumeData),
  getAll: () => apiClient.get('/resume'),
  update: (id, resumeData) => apiClient.put(`/resume/${id}`, resumeData),
  exportPdf: (resumeData) => apiClient.post('/resume/export-pdf', resumeData),
  delete: (id) => apiClient.delete(`/resume/${id}`),
};

/* ==================== INTERVIEW REPORT API ==================== */
export const reportApi = {
  create: (reportData) => apiClient.post('/interview-report', reportData),
  getAll: () => apiClient.get('/interview-report'),
  getById: (id) => apiClient.get(`/interview-report/${id}`),
  update: (id, reportData) => apiClient.put(`/interview-report/${id}`, reportData),
  delete: (id) => apiClient.delete(`/interview-report/${id}`),
};

/* ==================== COMPANY PREP API ==================== */
export const companyApi = {
  getAll: () => apiClient.get('/company-prep'),
  getById: (id) => apiClient.get(`/company-prep/${id}`),
  search: (query) => apiClient.get(`/company-prep?search=${query}`),
  filterByIndustry: (industry) => apiClient.get(`/company-prep?industry=${industry}`),
  addExperience: (id, experienceData) => apiClient.post(`/company-prep/${id}/experience`, experienceData),
};

/* ==================== PEER PRACTICE API ==================== */
export const peerPracticeApi = {
  create: (sessionData) => apiClient.post('/peer-practice/create', sessionData),
  getAll: () => apiClient.get('/peer-practice'),
  join: (id, roleData) => apiClient.post(`/peer-practice/${id}/join`, roleData),
  submitAnswer: (id, answerData) => apiClient.post(`/peer-practice/${id}/submit-answer`, answerData),
  submitFeedback: (id, feedbackData) => apiClient.post(`/peer-practice/${id}/submit-feedback`, feedbackData),
  endSession: (id) => apiClient.post(`/peer-practice/${id}/end`, {}),
};

/* ==================== GAMIFICATION API ==================== */
export const gamificationApi = {
  getStats: () => apiClient.get('/gamification/stats'),
  getBadges: () => apiClient.get('/gamification/badges'),
  getLeaderboard: () => apiClient.get('/gamification/leaderboard'),
  getChallenges: () => apiClient.get('/gamification/challenges'),
  awardBadge: (badgeData) => apiClient.post('/gamification/award-badge', badgeData),
  addXP: (xpData) => apiClient.post('/gamification/add-xp', xpData),
  completeChallenge: (id) => apiClient.post(`/gamification/challenges/${id}/complete`, {}),
};

/* ==================== VIDEO RECORDING API ==================== */
export const videoApi = {
  upload: (formData) => apiClient.post('/video-recording/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: () => apiClient.get('/video-recording/list'),
  getById: (id) => apiClient.get(`/video-recording/${id}`),
  addAiReview: (id, reviewData) => apiClient.post(`/video-recording/${id}/ai-review`, reviewData),
  delete: (id) => apiClient.delete(`/video-recording/${id}`),
  download: (id) => apiClient.get(`/video-recording/${id}/download`, {
    responseType: 'blob',
  }),
};

/* ==================== INTERVIEW NOTES API ==================== */
export const notesApi = {
  create: (noteData) => apiClient.post('/interview-notes/create', noteData),
  getAll: () => apiClient.get('/interview-notes'),
  getById: (id) => apiClient.get(`/interview-notes/${id}`),
  update: (id, noteData) => apiClient.put(`/interview-notes/${id}`, noteData),
  delete: (id) => apiClient.delete(`/interview-notes/${id}`),
  addBookmark: (id, bookmarkData) => apiClient.post(`/interview-notes/${id}/bookmark`, bookmarkData),
  addHighlight: (id, highlightData) => apiClient.post(`/interview-notes/${id}/highlight`, highlightData),
  search: (query) => apiClient.get(`/interview-notes?search=${query}`),
};

/* ==================== QUESTION RECOMMENDER API ==================== */
export const recommenderApi = {
  getSuggestions: (style = 'adaptive') => apiClient.get(`/question-recommender/suggestions?style=${style}`),
  getInsights: () => apiClient.get('/question-recommender/insights'),
  update: (updateData) => apiClient.post('/question-recommender/update', updateData),
  getWeakAreas: () => apiClient.get('/question-recommender/weak-areas'),
  getSpacedRepetition: () => apiClient.get('/question-recommender/spaced-repetition'),
};

/* ==================== QUICK PRACTICE API ==================== */
export const quickPracticeApi = {
  startSession: (duration) => apiClient.get(`/quick-practice/start/${duration}`),
  submitAnswer: (answerData) => apiClient.post('/quick-practice/submit-answer', answerData),
  endSession: (sessionData) => apiClient.post('/quick-practice/end-session', sessionData),
  getHistory: () => apiClient.get('/quick-practice/history'),
};

/* ==================== PROGRESS EXPORT API ==================== */
export const progressExportApi = {
  getAll: () => apiClient.get('/progress-export'),
  generate: (exportData) => apiClient.post('/progress-export/generate', exportData),
  download: (id) => apiClient.get(`/progress-export/${id}/download`, {
    responseType: 'blob',
  }),
  delete: (id) => apiClient.delete(`/progress-export/${id}`),
};

export default apiClient;
