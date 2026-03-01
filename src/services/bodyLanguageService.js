import apiClient from './apiClient';

export const analyzeBodyLanguage = async (metrics) => {
  const { data } = await apiClient.post('/api/ai/body-language/analyze', metrics);
  return data;
};

export default { analyzeBodyLanguage };
