const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Auth API
export const authAPI = {
  register: async (name, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  getMe: async (token) => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// Problems API
export const problemsAPI = {
  getAll: async (category, difficulty, page = 1, limit = 10) => {
    let url = `${API_URL}/api/problems?page=${page}&limit=${limit}`;
    if (category && category !== 'all') url += `&category=${category}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    
    const res = await fetch(url);
    return res.json();
  },

  getById: async (id, token) => {
    const res = await fetch(`${API_URL}/api/problems/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getByCategory: async (category, page = 1, limit = 10) => {
    const res = await fetch(`${API_URL}/api/problems/category/${category}?page=${page}&limit=${limit}`);
    return res.json();
  }
};

// Submissions API
export const submissionsAPI = {
  submit: async (problemId, code, language, hintLevel, token) => {
    const res = await fetch(`${API_URL}/api/submissions/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ problemId, code, language, hintLevel })
    });
    return res.json();
  },

  getUserSubmissions: async (token, page = 1, limit = 10) => {
    const res = await fetch(`${API_URL}/api/submissions/user/submissions?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};

// Progress API
export const progressAPI = {
  getProgress: async (token) => {
    const res = await fetch(`${API_URL}/api/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  getStats: async (token) => {
    const res = await fetch(`${API_URL}/api/progress/stats/user`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  updateProgress: async (problemId, solved, timeSpent, hintsUsed, language, token) => {
    const res = await fetch(`${API_URL}/api/progress/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ problemId, solved, timeSpent, hintsUsed, language })
    });
    return res.json();
  },

  getLeaderboard: async () => {
    const res = await fetch(`${API_URL}/api/progress/leaderboard`);
    return res.json();
  }
};

// Comments API
export const commentsAPI = {
  getComments: async (problemId, page = 1, limit = 10, sort = 'recent') => {
    const res = await fetch(`${API_URL}/api/comments/${problemId}?page=${page}&limit=${limit}&sort=${sort}`);
    return res.json();
  },

  postComment: async (problemId, content, type, language, code, token) => {
    const res = await fetch(`${API_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ problemId, content, type, language, code })
    });
    return res.json();
  }
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    const res = await fetch(`${API_URL}/api/admin/stats`);
    return res.json();
  }
};
