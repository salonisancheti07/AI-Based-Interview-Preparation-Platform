/**
 * VoiceProcessor Service
 * Handles speech recognition, voice processing, and NLP for voice input
 * Uses Web Speech API with fallback to Whisper API
 */

class VoiceProcessor {
  constructor() {
    this.recognition = this.initializeRecognition();
    this.isListening = false;
    this.transcript = '';
    this.isFinal = false;
    this.confidence = 0;
    this.listeners = {};
  }

  /**
   * Initialize Web Speech API
   */
  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    // Handle recognition results
    recognition.onstart = () => {
      this.isListening = true;
      this.emit('start');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      this.transcript = finalTranscript || interimTranscript;
      this.isFinal = finalTranscript !== '';
      this.confidence = maxConfidence;

      this.emit('result', {
        transcript: this.transcript,
        isFinal: this.isFinal,
        confidence: this.confidence,
        interim: interimTranscript,
        final: finalTranscript
      });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.emit('error', {
        error: event.error,
        message: this.getErrorMessage(event.error)
      });
    };

    recognition.onend = () => {
      this.isListening = false;
      this.emit('end', {
        finalTranscript: this.transcript,
        confidence: this.confidence
      });
    };

    return recognition;
  }

  /**
   * Start listening
   */
  startListening(language = 'en-US') {
    if (!this.recognition) {
      this.emit('error', { message: 'Speech Recognition not supported in this browser. Please use the record button.' });
      throw new Error('Speech Recognition not supported');
    }

    try {
      this.recognition.language = language;
      this.transcript = '';
      this.confidence = 0;
      this.recognition.start();
    } catch (error) {
      this.emit('error', {
        error: error.name || 'start-failed',
        message: error.message || 'Could not start voice recognition'
      });
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Analyze voice quality and characteristics
   */
  analyzeVoiceQuality(audioContext, analyser) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const max = Math.max(...dataArray);
    const min = Math.min(...dataArray);
    const range = max - min;

    return {
      volume: (average / 255) * 100,
      clarity: (range / 255) * 100,
      frequency: this.analyzeFrequency(dataArray),
      quality: this.calculateQualityScore(average, range)
    };
  }

  /**
   * Analyze frequency distribution
   */
  analyzeFrequency(dataArray) {
    const mids = dataArray.slice(0, Math.floor(dataArray.length / 3)).reduce((a, b) => a + b) / (dataArray.length / 3);
    const highs = dataArray.slice(Math.floor(dataArray.length / 3)).reduce((a, b) => a + b) / (2 * dataArray.length / 3);
    const lows = dataArray.slice(0, Math.floor(dataArray.length / 4)).reduce((a, b) => a + b) / (dataArray.length / 4);

    return { lows, mids, highs };
  }

  /**
   * Calculate voice quality score
   */
  calculateQualityScore(average, range) {
    const volumeScore = Math.min(average / 2.55, 100);
    const clarityScore = Math.min(range / 2.55, 100);
    return (volumeScore * 0.6 + clarityScore * 0.4);
  }

  /**
   * Text-to-Speech with voice selection
   */
  speakText(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Text-to-Speech not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.lang = options.language || 'en-US';

      // Select voice if available
      if (options.voiceIndex !== undefined) {
        const voices = window.speechSynthesis.getVoices();
        if (voices[options.voiceIndex]) {
          utterance.voice = voices[options.voiceIndex];
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(e.error));

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Get available voices
   */
  getVoices() {
    if (!('speechSynthesis' in window)) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }

  /**
   * Detect language from text
   */
  detectLanguage(text) {
    const languages = {
      en: /[a-zA-Z]/g,
      es: /[áéíóúñ]/g,
      fr: /[àâäéèêëïîôöùûüœæ]/g,
      de: /[äöüß]/g,
      hi: /[\u0900-\u097F]/g,
      zh: /[\u4E00-\u9FFF]/g,
      ja: /[\u3040-\u309F\u30A0-\u30FF]/g,
      ko: /[\uAC00-\uD7AF]/g
    };

    let maxMatches = 0;
    let detectedLang = 'en';

    for (const [lang, regex] of Object.entries(languages)) {
      const matches = (text.match(regex) || []).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }

  /**
   * Transcribe audio file using Whisper API
   */
  async transcribeAudio(audioBlob, options = {}) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', options.language || 'en');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return {
        text: data.text,
        language: options.language || 'en',
        duration: options.duration || 0
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Normalize transcribed text
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[,;:]/g, '')
      .replace(/\?\s*$/, '')
      .replace(/!\s*$/, '');
  }

  /**
   * Extract intent from voice input
   */
  extractIntent(transcript) {
    const intentPatterns = {
      'clarify': /^(can you )?explain|clarify|what|how|why|tell me/i,
      'help': /help|assist|guide|show me|teach|explain/i,
      'repeat': /repeat|again|once more|say it again/i,
      'next': /next|continue|go ahead|proceed/i,
      'previous': /previous|back|go back|last/i,
      'stop': /stop|quit|exit|done|finish|end/i,
      'details': /details|more|elaborate|expansion|depth/i,
      'example': /example|instance|like|for instance|sample/i,
      'hint': /hint|clue|suggestion|tip|help/i
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(transcript)) {
        return intent;
      }
    }

    return 'statement';
  }

  /**
   * Get error message for error code
   */
  getErrorMessage(errorCode) {
    const errors = {
      'no-speech': 'No speech detected. Please try again.',
      'network': 'Network error. Check your internet connection.',
      'not-allowed': 'Microphone access denied. Please enable it in browser settings.',
      'bad-grammar': 'Speech format not recognized.',
      'service-not-allowed': 'Speech service not allowed.'
    };

    return errors[errorCode] || 'An error occurred during speech recognition.';
  }

  /**
   * Event emitter
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export default new VoiceProcessor();
