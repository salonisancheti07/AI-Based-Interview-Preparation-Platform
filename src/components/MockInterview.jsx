import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../services/apiClient';
import VoiceProcessor from '../services/VoiceProcessor';
import TextAnalyzer from '../services/TextAnalyzer';
import LLMCache from '../services/LLMCache';
import { ttsSpeak, translateText, playBase64Audio } from '../services/voiceService';
import '../styles/MockInterview.css';

const getPayload = (res) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

const MockInterview = () => {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewType, setInterviewType] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [interviewData, setInterviewData] = useState(null);
  const [questionOrder, setQuestionOrder] = useState([]);
  const [orderPos, setOrderPos] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [improvedAnswer, setImprovedAnswer] = useState('');
  const [language, setLanguage] = useState('en');
  const [translationPreview, setTranslationPreview] = useState(null);
  const [lockDifficulty, setLockDifficulty] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [recordingError, setRecordingError] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const STORAGE_KEY = 'mockInterviewSession';
  const location = useLocation();

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const mediaStream = useRef(null);
  const recordingStartTime = useRef(0);
  const voiceSupported = useRef(true);

  const roles = ['Software Engineer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX Designer'];
  const interviewTypes = [
    { value: 'technical', label: 'Technical Interview' },
    { value: 'behavioral', label: 'Behavioral Interview' },
    { value: 'hr', label: 'HR Interview' },
    { value: 'mixed', label: 'Mixed Interview' }
  ];

  useEffect(() => {
    const handleVoiceResult = (data) => {
      if (data?.transcript) setUserAnswer(data.transcript);
    };

    const handleVoiceError = (error) => {
      setIsListening(false);
      setRecordingError(error?.message || 'Voice input failed');
    };
    const handleVoiceEnd = () => setIsListening(false);

    VoiceProcessor.on('result', handleVoiceResult);
    VoiceProcessor.on('error', handleVoiceError);
    VoiceProcessor.on('end', handleVoiceEnd);

    return () => {
      VoiceProcessor.off('result', handleVoiceResult);
      VoiceProcessor.off('error', handleVoiceError);
      VoiceProcessor.off('end', handleVoiceEnd);
    };
  }, []);

  useEffect(() => () => {
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }
  }, [recordedAudioUrl]);

  // restore session
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.interviewStarted) {
        setInterviewStarted(true);
        setInterviewType(saved.interviewType || '');
        setTargetRole(saved.targetRole || '');
        setInterviewData(saved.interviewData || null);
        setQuestionOrder(saved.questionOrder || []);
        setOrderPos(saved.orderPos || 0);
        setEvaluations(saved.evaluations || []);
        setInterviewComplete(saved.interviewComplete || false);
        setUserAnswer(saved.userAnswer || '');
        setLockDifficulty(saved.lockDifficulty || false);
      }
    } catch (e) {
      console.warn('Restore mock interview failed', e);
    }
  }, []);

  // apply presets from navigation state
  useEffect(() => {
    const round = location.state?.round || location.state?.interviewType;
    const presetRole = location.state?.targetRole;
    const mapRoundToType = (value) => {
      const v = (value || '').toLowerCase();
      if (v.includes('behavior')) return 'behavioral';
      if (v.includes('design')) return 'mixed';
      if (v.includes('hr')) return 'hr';
      return 'technical';
    };
    if (round) setInterviewType((prev) => prev || mapRoundToType(round));
    if (presetRole) setTargetRole(presetRole);
  }, [location.state]);

  // persist session
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          interviewStarted,
          interviewType,
          targetRole,
          interviewData,
          questionOrder,
          orderPos,
          userAnswer,
          evaluations,
          interviewComplete,
          lockDifficulty
        })
      );
    } catch (e) {
      console.warn('Persist mock interview failed', e);
    }
  }, [interviewStarted, interviewType, targetRole, interviewData, questionOrder, orderPos, userAnswer, evaluations, interviewComplete, lockDifficulty]);

  const handleSpeakQuestion = async () => {
    try {
      const currentQuestionIndex = questionOrder[orderPos] ?? 0;
      const currentQuestion = interviewData?.questions?.[currentQuestionIndex];
      if (!currentQuestion?.question) return;
      const res = await ttsSpeak({ text: currentQuestion.question, lang: language });
      if (res?.audioBase64) {
        await playBase64Audio(res.audioBase64, res.contentType);
        setActionNotice('');
      } else {
        await VoiceProcessor.speakText(currentQuestion.question, { language });
        setActionNotice('Using browser voice (no cloud TTS key set).');
      }
    } catch (err) {
      console.warn('TTS failed', err);
      try {
        await VoiceProcessor.speakText(interviewData?.questions?.[orderPos]?.question || '');
        setActionNotice('Cloud TTS failed; fell back to browser speech.');
      } catch (inner) {
        setActionNotice('Voice output failed. Check mic/sound permissions.');
      }
    }
  };

  const handleTranslateAnswer = async () => {
    if (!userAnswer.trim()) return;
    try {
      const res = await translateText({ text: userAnswer, sourceLang: language, targetLang: 'en' });
      setTranslationPreview(res);
    } catch (err) {
      console.warn('Translate failed', err);
    }
  };

  const startRecording = async () => {
    try {
      setRecordingError('');
      setActionNotice('');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser');
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      recordingStartTime.current = Date.now();

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunks.current.push(event.data);
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordedAudioUrl('');
      setRecordingDuration(0);
    } catch (err) {
      setRecordingError(err.message || 'Please enable microphone access.');
      setActionNotice('Recording blocked — allow mic access or use Voice Input.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () =>
    new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') return resolve(null);

      mediaRecorder.current.onstop = () => {
        const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setIsRecording(false);
        const durationSeconds = Math.max(1, Math.round((Date.now() - recordingStartTime.current) / 1000));
        setRecordingDuration(durationSeconds);
        setUserAnswer((prev) => (prev?.trim() ? prev : `[Voice recording attached: ${durationSeconds}s]`));

        if (mediaStream.current) {
          mediaStream.current.getTracks().forEach((track) => track.stop());
          mediaStream.current = null;
        }

        resolve(blob);
      };
      mediaRecorder.current.stop();
    });

  const startVoiceInput = () => {
    try {
      VoiceProcessor.startListening('en-US');
      setIsListening(true);
      setRecordingError('');
      setActionNotice('');
    } catch {
      voiceSupported.current = false;
      setRecordingError('Voice input not available. Please allow mic access or use the record button.');
      setActionNotice('SpeechRecognition not supported in this browser; try recording.');
    }
  };

  const stopVoiceInput = () => {
    VoiceProcessor.stopListening();
    setIsListening(false);
  };

  const handleStopRecording = async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob) return;

    // Optional: auto-transcribe using Whisper if API key exists
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      try {
        const result = await VoiceProcessor.transcribeAudio(audioBlob, { language: 'en' });
        if (result?.text?.trim()) {
          setUserAnswer(result.text.trim());
        }
      } catch (error) {
        setRecordingError(error?.message || 'Recording saved, but transcription failed');
      }
    }
  };

  const handleStartInterview = async () => {
    if (!interviewType || !targetRole) {
      alert('Please select interview type and role');
      return;
    }

    setLoading(true);
    try {
      const payload = getPayload(
        await axios.post('/api/ai/mock-interview/start', {
          interviewType,
          targetRole,
          difficulty: 'Medium'
        })
      );

      setInterviewData(payload);
      setInterviewStarted(true);
      setQuestionOrder(order);
      setOrderPos(0);
      setEvaluations([]);
      setUserAnswer('');
      setRecordedAudioUrl('');
      setRecordingError('');
      setRecordingDuration(0);
    } catch (err) {
      alert(`Error starting interview: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please provide an answer');
      return;
    }

    setLoading(true);
    try {
      const answerAnalysis = TextAnalyzer.analyzeText(userAnswer);
      setAnalysis(answerAnalysis);
      setFeedback(TextAnalyzer.generateFeedback(answerAnalysis));

      const currentQuestionIndex = questionOrder[orderPos] ?? 0;
      let evaluation = LLMCache.get(userAnswer, 'mock-interview', { questionIndex: currentQuestionIndex, interviewType });

      if (!evaluation) {
        const payload = getPayload(
          await axios.post(`/api/ai/mock-interview/${interviewData.interviewId}/submit-answer`, {
            questionIndex: currentQuestionIndex,
            userAnswer,
            analysis: answerAnalysis
          })
        );
        evaluation = payload.evaluation || {};
        LLMCache.set(userAnswer, evaluation, 'mock-interview', { questionIndex: currentQuestionIndex, interviewType });
      }

      const updated = [...evaluations, evaluation];
      setEvaluations(updated);

      const remaining = (questionOrder.length || 0) - (orderPos + 1);
      if (remaining <= 0) {
        await handleCompleteInterview(updated);
      } else {
        if (!lockDifficulty && interviewData?.questions?.length) {
          const remainingIndexes = questionOrder.slice(orderPos + 1);
          const difficultyRank = { Easy: 1, Medium: 2, Hard: 3, easy: 1, medium: 2, hard: 3 };
          const score = evaluation.correctness ?? evaluation.score ?? 0;
          if (remainingIndexes.length) {
            const newOrder = [...questionOrder];
            if (score >= 80) {
              const hardest = remainingIndexes
                .map((i) => ({ i, d: difficultyRank[interviewData.questions[i].difficulty] || 2 }))
                .sort((a, b) => b.d - a.d)[0];
              const pos = newOrder.indexOf(hardest.i);
              if (pos > orderPos + 1) {
                const [item] = newOrder.splice(pos, 1);
                newOrder.splice(orderPos + 1, 0, item);
              }
            } else if (score < 50) {
              const easiest = remainingIndexes
                .map((i) => ({ i, d: difficultyRank[interviewData.questions[i].difficulty] || 2 }))
                .sort((a, b) => a.d - b.d)[0];
              const pos = newOrder.indexOf(easiest.i);
              if (pos > orderPos + 1) {
                const [item] = newOrder.splice(pos, 1);
                newOrder.splice(orderPos + 1, 0, item);
              }
            }
            setQuestionOrder(newOrder);
          }
        }
        setOrderPos((prev) => prev + 1);
        setUserAnswer('');
        setRecordedAudioUrl('');
        setRecordingDuration(0);
        setRecordingError('');
      }
    } catch (err) {
      alert(`Error submitting answer: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImproveAnswer = async () => {
    const text = userAnswer.trim();
    if (!text) {
      alert('Write an answer first.');
      return;
    }
    setLoading(true);
    try {
      const payload = getPayload(
        await axios.post('/api/ai/tutor/chat', {
          topic: interviewType || 'Mock Interview',
          sessionType: 'answer-coach',
          message: `Improve this interview answer for the role ${targetRole || 'Software Engineer'}: ${text}`
        })
      );
      const improved = payload?.response || text;
      setImprovedAnswer(improved);
    } catch (err) {
      alert(`Improve failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = async (latestEvaluations = evaluations) => {
    try {
      const payload = getPayload(await axios.post(`/api/ai/mock-interview/${interviewData.interviewId}/complete`));
      setInterviewData(payload);
      setEvaluations(latestEvaluations);
      setInterviewComplete(true);
    } catch (err) {
      alert(`Error completing interview: ${err.response?.data?.message || err.message}`);
    }
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setInterviewType('');
    setTargetRole('');
    setInterviewData(null);
    setQuestionOrder([]);
    setOrderPos(0);
    setUserAnswer('');
    setEvaluations([]);
    setInterviewComplete(false);
    setAnalysis(null);
    setFeedback(null);
    setRecordedAudioUrl('');
    setRecordingError('');
    setRecordingDuration(0);
  };

  if (interviewComplete && interviewData) {
    return (
      <div className="mock-interview-container">
        <div className="results-container">
          <h2>Interview Complete</h2>
          <div className="scores-grid">
            <div className="score-card">
              <h3>Overall Score</h3>
              <div className="large-score">{Number(interviewData.summary?.overallScore || 0).toFixed(1)}</div>
              <p>/100</p>
            </div>
            <div className="score-card">
              <h3>Readiness Score</h3>
              <div className="large-score">{Number(interviewData.summary?.readinessScore || 0).toFixed(1)}</div>
              <p>/100</p>
            </div>
          </div>

          <div className="feedback-section">
            <h3>AI Feedback</h3>
            <p>{interviewData.summary?.feedback || 'Feedback not available.'}</p>
          </div>

          <div className="evaluations-list">
            <h3>Question Analysis</h3>
            {evaluations.map((evaluation, idx) => (
              <div key={idx} className="evaluation-item">
                <h4>Question {idx + 1}</h4>
                <div className="eval-scores">
                  {evaluation.isCorrect !== undefined && (
                    <span>{evaluation.isCorrect ? 'Status: Pass' : 'Status: Needs Improvement'}</span>
                  )}
                  {evaluation.correctness !== undefined && <span>Correctness: {evaluation.correctness}</span>}
                  {evaluation.relevance !== undefined && <span>Relevance: {evaluation.relevance}</span>}
                  {evaluation.communication !== undefined && <span>Communication: {evaluation.communication}</span>}
                </div>
                <p><strong>Feedback:</strong> {evaluation.feedback || 'No detailed feedback.'}</p>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={resetInterview}>Start New Interview</button>
        </div>
      </div>
    );
  }

  if (interviewStarted && interviewData && !interviewComplete) {
    const currentQuestionIndex = questionOrder[orderPos] ?? 0;
    const currentQuestion = interviewData.questions?.[currentQuestionIndex];
    const startedAt = interviewData.startedAt ? new Date(interviewData.startedAt) : new Date();
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));

    return (
      <div className="mock-interview-container">
        <div className="interview-panel">
          <div className="interview-header">
            <h2>{interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview</h2>
            <div className="progress">
              Question {orderPos + 1} of {interviewData.questions?.length || 1}
            </div>
            <label className="lock-toggle">
              <input type="checkbox" checked={lockDifficulty} onChange={(e) => setLockDifficulty(e.target.checked)} />
              Lock difficulty
            </label>
          </div>

          <div className="question-container">
            <h3>{currentQuestion?.question || 'Loading question...'}</h3>
            <div className="timer">Time spent: {elapsed}s</div>
            <div className="button-group">
              <button className="btn-secondary" onClick={handleSpeakQuestion} disabled={!interviewData}>
                🔊 Speak Question
              </button>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select-input compact">
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
              </select>
            </div>
          </div>

          <div className="answer-container">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows="6"
            />
            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={() => (isRecording ? handleStopRecording() : startRecording())}
                disabled={loading}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              {voiceSupported.current && (
                <button className="btn-secondary" onClick={() => (isListening ? stopVoiceInput() : startVoiceInput())}>
                  {isListening ? 'Stop Voice' : 'Voice Input'}
                </button>
              )}
              <button className="btn-secondary" onClick={handleTranslateAnswer} disabled={loading || !userAnswer.trim()}>
                Translate to English
              </button>
              <button className="btn-secondary" onClick={handleImproveAnswer} disabled={loading || !userAnswer.trim()}>
                Improve Answer
              </button>
              <button className="btn-primary" onClick={handleSubmitAnswer} disabled={loading}>
                {loading ? 'Evaluating...' : 'Submit Answer'}
              </button>
            </div>
            {isRecording && <p className="timer">Recording...</p>}
            {recordingError && <p className="recording-error">{recordingError}</p>}
            {recordedAudioUrl && (
              <div className="recording-preview">
                <p className="timer">Recorded clip: {recordingDuration}s</p>
                <audio controls src={recordedAudioUrl}>
                  <track kind="captions" />
                </audio>
              </div>
            )}
          </div>

          {evaluations.length > 0 && (
            <div className="feedback-preview">
              <h4>Last Evaluation</h4>
              <p>
                <strong>Status:</strong>{' '}
                {evaluations[evaluations.length - 1].isCorrect ? 'Pass' : 'Needs Improvement'}
              </p>
              <p><strong>Score:</strong> {evaluations[evaluations.length - 1].correctness ?? 'N/A'}</p>
              <p><strong>Feedback:</strong> {evaluations[evaluations.length - 1].feedback || 'No feedback yet.'}</p>
            </div>
          )}

          {analysis && feedback && (
            <div className="feedback-preview">
              <h4>Text Analysis</h4>
              <p><strong>Confidence:</strong> {analysis.confidence?.level || 'N/A'}</p>
              <p><strong>Suggestion:</strong> {Array.isArray(feedback) ? feedback[0] : 'Keep answers concise and structured.'}</p>
            </div>
          )}

          {actionNotice && (
            <div className="feedback-preview info">
              <p>{actionNotice}</p>
              <button className="btn-secondary" onClick={() => setActionNotice('')}>Dismiss</button>
            </div>
          )}

          {translationPreview && (
            <div className="feedback-preview">
              <h4>Translation</h4>
              <p><strong>Corrected:</strong> {translationPreview.corrected}</p>
              <p><strong>English:</strong> {translationPreview.translated}</p>
              <button className="btn-secondary" onClick={() => setTranslationPreview(null)}>Clear</button>
            </div>
          )}

          {improvedAnswer && (
            <div className="feedback-preview">
              <h4>Improved Answer (AI)</h4>
              <div className="diff-view">
                <div>
                  <p className="muted">Original</p>
                  <pre className="diff-block">{userAnswer}</pre>
                </div>
                <div>
                  <p className="muted">Improved</p>
                  <pre className="diff-block">{improvedAnswer}</pre>
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setUserAnswer(improvedAnswer);
                  setImprovedAnswer('');
                }}
              >
                Use Improved Answer
              </button>
              <button className="btn-secondary" onClick={() => setImprovedAnswer('')}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mock-interview-container">
      <div className="setup-panel">
        <h2>AI Mock Interview</h2>
        <p>Practice interview rounds with real-time AI feedback.</p>

        <div className="setup-form">
          <div className="form-group">
            <label>Interview Type:</label>
            <div className="option-grid">
              {interviewTypes.map((type) => (
                <button
                  key={type.value}
                  className={`option-btn ${interviewType === type.value ? 'active' : ''}`}
                  onClick={() => setInterviewType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Target Role:</label>
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="select-input">
              <option value="">Select a role...</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Language for TTS / STT:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select-input">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <button className="btn-primary btn-large" onClick={handleStartInterview} disabled={loading}>
            {loading ? 'Starting...' : 'Start Interview'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;
