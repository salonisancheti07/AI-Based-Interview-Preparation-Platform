import apiClient from './apiClient';

export const fetchAtsScore = async ({ resumeText, role }) => {
  const { data } = await apiClient.post('/api/ai/resume/ats-score', { resumeText, role });
  return data;
};

export const fetchResumeQuestions = async ({ resumeText, role }) => {
  const { data } = await apiClient.post('/api/ai/resume/questions', { resumeText, role });
  return data;
};

export default { fetchAtsScore, fetchResumeQuestions };
