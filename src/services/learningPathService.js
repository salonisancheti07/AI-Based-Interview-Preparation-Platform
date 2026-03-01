import apiClient from './apiClient';

export const generateLearningPath = async ({ role, experience, goal, hoursPerDay }) => {
  const { data } = await apiClient.post('/api/ai/learning-path', {
    role,
    experience,
    goal,
    hoursPerDay
  });
  return data;
};

export default { generateLearningPath };
