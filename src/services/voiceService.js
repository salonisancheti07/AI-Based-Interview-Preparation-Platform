import apiClient from './apiClient';

export const ttsSpeak = async ({ text, voiceId, lang }) => {
  const { data } = await apiClient.post('/api/ai/voice/tts', { text, voiceId, lang });
  return data;
};

export const translateText = async ({ text, sourceLang = 'auto', targetLang = 'en' }) => {
  const { data } = await apiClient.post('/api/ai/voice/translate', { text, sourceLang, targetLang });
  return data;
};

export const playBase64Audio = (base64, mime = 'audio/mpeg') =>
  new Promise((resolve, reject) => {
    if (!base64) return resolve();
    const audio = new Audio(`data:${mime};base64,${base64}`);
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play();
  });

export default {
  ttsSpeak,
  translateText,
  playBase64Audio
};
