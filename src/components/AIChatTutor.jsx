import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../services/apiClient';
import VoiceProcessor from '../services/VoiceProcessor';
import TextAnalyzer from '../services/TextAnalyzer';
import '../styles/AIChatTutor.css';

const normalizeApiPayload = (res) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

const AIChatTutor = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      message: "Hi. I am your AI tutor. Ask me DSA, system design, aptitude, or interview prep questions.",
      timestamp: new Date(),
      sources: []
    }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [topic, setTopic] = useState('System Design');
  const [sessionType, setSessionType] = useState('doubt-solving');
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [ragStatus, setRagStatus] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [useStreaming, setUseStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const STORAGE_KEY = 'aiTutorSession';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    VoiceProcessor.on('result', handleVoiceResult);
    VoiceProcessor.on('error', handleVoiceError);
    VoiceProcessor.on('end', handleVoiceEnd);

    return () => {
      VoiceProcessor.off('result', handleVoiceResult);
      VoiceProcessor.off('error', handleVoiceError);
      VoiceProcessor.off('end', handleVoiceEnd);
    };
  }, []);

  // restore last session
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.messages?.length) {
        setMessages(saved.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
        setTopic(saved.topic || '');
        setSessionType(saved.sessionType || 'doubt-solving');
        setSessionActive(saved.sessionActive || false);
      }
    } catch (e) {
      console.warn('Restore tutor session failed', e);
    }
  }, []);

  // persist session
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          messages,
          topic,
          sessionType,
          sessionActive
        })
      );
    } catch (e) {
      console.warn('Persist tutor session failed', e);
    }
  }, [messages, topic, sessionType, sessionActive]);

  useEffect(() => {
    const fetchRagStatus = async () => {
      try {
        const payload = normalizeApiPayload(await apiClient.get('/api/ai/tutor/rag/status'));
        if (payload?.success && payload?.rag) {
          setRagStatus(payload.rag);
        }
      } catch {
        setRagStatus(null);
      }
    };

    fetchRagStatus();
  }, []);

  const handleVoiceResult = (data) => {
    if (data.isFinal) setUserMessage(data.transcript);
  };

  const handleVoiceError = (error) => {
    setVoiceSupported(false);
    setSessionError(error?.message || 'Voice input failed. Please check mic permissions.');
    setIsListening(false);
  };

  const handleVoiceEnd = () => setIsListening(false);

  const handleStartVoice = () => {
    // Auto-start session if user jumps straight to mic
    if (!sessionActive) setSessionActive(true);
    try {
      VoiceProcessor.startListening('en-US');
      setIsListening(true);
      setSessionError('');
    } catch (err) {
      setVoiceSupported(false);
      setSessionError(err?.message || 'Microphone not available. Allow mic access and try again.');
    }
  };

  const handleStopVoice = () => {
    VoiceProcessor.stopListening();
    setIsListening(false);
  };

  const handleSendMessage = async () => {
    const rawMessage = userMessage.trim();
    if (!rawMessage || !sessionActive || loading) return;
    setSessionError('');

    setMessages((prev) => [...prev, { sender: 'user', message: rawMessage, timestamp: new Date(), sources: [] }]);
    setAnalysis(TextAnalyzer.analyzeText(rawMessage));
    setUserMessage('');
    setLoading(true);

    try {
      const cached = null; // force fresh LLM call to avoid repetitive answers
      let aiText = '';
      let aiSources = [];

      if (cached && !useStreaming) {
        aiText = cached.response;
        aiSources = cached.sources || [];
      } else if (useStreaming) {
        aiText = await streamTutorResponse(rawMessage);
      } else {
        const payload = normalizeApiPayload(await apiClient.post('/api/ai/tutor/chat', {
          topic,
          sessionType,
          message: rawMessage
        }));

        aiText = payload?.response || 'No response generated.';
        aiSources = Array.isArray(payload?.sources) ? payload.sources : [];
      }

      setMessages((prev) => [...prev, { sender: 'ai', message: aiText, timestamp: new Date(), sources: aiSources }]);
    } catch (err) {
      const errorText = err?.response?.data?.message || err?.message || 'Please try again.';
      const fallback = TextAnalyzer.generateHint
        ? TextAnalyzer.generateHint(rawMessage)
        : 'Here are some steps: restate the problem, outline approach, then code.';
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', message: `Error: ${errorText}. Fallback: ${fallback}`, timestamp: new Date(), sources: [] }
      ]);
      setSessionError(errorText);
    } finally {
      setLoading(false);
    }
  };

  const streamTutorResponse = async (rawMessage) => {
    const controller = new AbortController();
    const res = await fetch('/api/ai/tutor/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, sessionType, message: rawMessage, tutorMode: 'hint' }),
      signal: controller.signal
    });
    if (!res.body) {
      throw new Error('Stream not supported');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = copy[copy.length - 1]; // keep user message
        return copy;
      });
      // update streaming placeholder
      setMessages((prev) => {
        const withoutTail = prev.filter((m) => m.sender !== 'ai-stream-temp');
        return [
          ...withoutTail,
          { sender: 'ai-stream-temp', message: fullText, timestamp: new Date(), sources: [] }
        ];
      });
    }
    // finalize stream message
    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => m.sender !== 'ai-stream-temp');
      return [
        ...withoutTemp,
        { sender: 'ai', message: fullText.trim(), timestamp: new Date(), sources: [] }
      ];
    });
    return fullText.trim();
  };

  const handleStartSession = () => {
    if (!topic) {
      setSessionError('Select a topic to start the tutor session.');
      return;
    }
    setSessionError('');
    setSessionActive(true);
    setMessages([
      {
        sender: 'ai',
        message: `Session started for ${topic}. Ask your first question.`,
        timestamp: new Date(),
        sources: []
      }
    ]);
  };

  const handleEndSession = () => {
    setSessionActive(false);
    setTopic('');
    setMessages([
      {
        sender: 'ai',
        message: 'Session ended. Start a new one when you are ready.',
        timestamp: new Date(),
        sources: []
      }
    ]);
  };

  const topics = [
    'Arrays & Strings',
    'Linked Lists',
    'Trees & Graphs',
    'Dynamic Programming',
    'Sorting & Searching',
    'Hash Tables',
    'System Design',
    'Database Concepts',
    'Behavioral Questions',
    'Aptitude',
    'Career Guidance'
  ];

  const quickPrompts = [
    'Give 3 medium DSA questions on arrays with hints only.',
    'Mock interviewer: system design URL shortener, start with clarifying questions.',
    'Explain TCP vs UDP in 4 bullet points.',
    'Behavioral: tell me about a conflict, critique my STAR outline.',
    'Generate 5 follow-up questions after coding solution explanation.'
  ];

  const sessionTypes = [
    { value: 'doubt-solving', label: 'Doubt Solving' },
    { value: 'concept-explanation', label: 'Concept Explanation' },
    { value: 'career-guidance', label: 'Career Guidance' },
    { value: 'interview-prep', label: 'Interview Prep' }
  ];

  if (!sessionActive) {
    return (
      <div className="ai-tutor-container">
        <div className="tutor-setup">
          <div className="setup-header">
            <h2>AI Chat Tutor</h2>
            <p>RAG-enabled tutor grounded on interview preparation knowledge.</p>
            {ragStatus?.enabled && (
              <p className="rag-meta">
                RAG active • {ragStatus.totalChunks} chunks • {ragStatus.topics?.length || 0} topics
              </p>
            )}
          </div>

          <div className="setup-content">
            {sessionError && <div className="form-error">{sessionError}</div>}
            <div className="form-section">
              <h3>Select Topic</h3>
              <div className="topics-grid">
                {topics.map((t) => (
                  <button key={t} className={`topic-btn ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>Session Type</h3>
              <div className="session-types">
                {sessionTypes.map((type) => (
                  <label key={type.value} className="radio-option">
                    <input
                      type="radio"
                      name="sessionType"
                      value={type.value}
                      checked={sessionType === type.value}
                      onChange={(e) => setSessionType(e.target.value)}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-section">
              <h3>Response Mode</h3>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                />
                <span>Enable streaming responses (faster feel)</span>
              </label>
            </div>

            <button className="btn-start-session" onClick={handleStartSession}>
              Start Chat Session
            </button>
            <button
              className="btn-start-session secondary"
              onClick={() => setSessionActive(true)}
              style={{ marginTop: '10px' }}
            >
              Resume Last Session
            </button>
            <div className="quick-prompts">
              <p>Or pick a quick prompt:</p>
              <div className="prompt-chips">
                {quickPrompts.map((p, idx) => (
                  <button key={idx} className="prompt-chip" onClick={() => { setUserMessage(p); setSessionActive(true); setMessages([{ sender: 'ai', message: `Session started for ${topic}. Ask your first question.`, timestamp: new Date(), sources: [] }]); }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-tutor-container">
      <div className="tutor-chat">
        <div className="chat-header">
          <div className="header-info">
            <h3>AI Tutor - {topic}</h3>
            <p className="session-type">{sessionType.split('-').join(' ')}</p>
          </div>
          <button className="btn-end-session" onClick={handleEndSession}>
            End Session
          </button>
        </div>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              <div className="message-avatar">{msg.sender === 'ai' ? 'AI' : 'U'}</div>
              <div className="message-content">
                <p>{msg.message}</p>
                {msg.sender === 'ai' && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                  <div className="source-list">
                    {msg.sources.map((source) => (
                      <span key={`${idx}-${source.ref}`} className="source-chip">
                        [{source.ref}] {source.title}
                      </span>
                    ))}
                  </div>
                )}
                <span className="timestamp">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message ai">
              <div className="message-avatar">AI</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask your question..."
              className="message-input"
              disabled={loading}
            />
            {voiceSupported && (
              <button
                className={`btn-voice ${isListening ? 'listening' : ''}`}
                onClick={isListening ? handleStopVoice : handleStartVoice}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? 'Stop Mic' : 'Mic'}
              </button>
            )}
            <button className="btn-send" onClick={handleSendMessage} disabled={loading || !userMessage.trim()}>
              {loading ? '...' : 'Send'}
            </button>
          </div>

          <p className="input-hint">Try: "Explain binary search with Java code" or "Solve two sum in Python".</p>

          {analysis && (
            <div className="analysis-info">
              <p>
                Confidence: {analysis.confidence.level} | Sentiment: {analysis.sentiment.type} | Score:{' '}
                {Math.round(analysis.confidence.score)}%
              </p>
            </div>
          )}

          {sessionError && (
            <div className="analysis-info">
              <p>Error: {sessionError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatTutor;
