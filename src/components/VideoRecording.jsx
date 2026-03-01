import React, { useEffect, useRef, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/VideoRecording.css';

const getPayload = (response) => (response && typeof response === 'object' && 'data' in response ? response.data : response);

const normalizeRecording = (raw = {}, index = 0) => ({
  _id: raw.id || `r-${index}`,
  recordingNumber: raw.id || index + 1,
  createdAt: raw.createdAt || raw.date || new Date().toISOString(),
  duration: typeof raw.duration === 'number' ? raw.duration : 0,
  analysisMetrics: { overallScore: raw.score || 0 },
  title: raw.title || `Recording #${index + 1}`
});

export default function VideoRecording() {
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await axios.get('/api/video-recording/list');
        const payload = getPayload(response) || [];
        setRecordings(payload.map(normalizeRecording));
      } catch (err) {
        console.error('Error fetching recordings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();

    return () => {
      stopRecording();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const uploadRecording = async (blob) => {
    try {
      // Optional: send blob if backend supports multipart. Fallback to metadata only.
      const formData = new FormData();
      formData.append('title', `Mock Recording ${new Date().toLocaleString()}`);
      if (blob) formData.append('file', blob, 'recording.webm');
      const response = await axios.post('/api/video-recording/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const payload = getPayload(response);
      if (payload) {
        setRecordings((prev) => [normalizeRecording(payload, prev.length), ...prev]);
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const startRecording = async () => {
    try {
      setPermissionError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const localUrl = URL.createObjectURL(blob);
        setPreviewUrl(localUrl);
        const newRecording = normalizeRecording(
          { id: `local-${Date.now()}`, createdAt: new Date().toISOString(), duration: Math.round(elapsed), title: 'Latest mock', score: Math.min(100, 60 + Math.floor(Math.random() * 40)) },
          recordings.length
        );
        newRecording.url = localUrl;
        setRecordings((prev) => [newRecording, ...prev]);
        await uploadRecording(blob);
      };
      recorder.start();
      startTimers(stream);
      setIsRecording(true);
    } catch (err) {
      setPermissionError(err.message || 'Camera or mic blocked. Please allow permissions and try again.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaStream?.getTracks()?.forEach((track) => track.stop());
    stopTimers();
    setIsRecording(false);
  };

  const startTimers = (stream) => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);

    // mic level monitor
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);
      const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + Math.pow(v - 128, 2), 0) / dataArray.length);
      setMicLevel(Math.min(100, Math.round((rms / 128) * 100)));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setMicLevel(0);
  };

  if (loading) return <div className="loading">Loading recordings...</div>;

  return (
    <div className="video-recording-container">
      <div className="video-header">
        <h1>Video Recording and Review</h1>
        <p>Record mock interviews, monitor mic levels, and replay instantly.</p>
        {permissionError && <p className="error-banner">{permissionError}</p>}
      </div>

      <div className="video-main">
        <div className="recording-studio">
          <div className="video-preview">
            <video ref={videoRef} autoPlay muted className="preview-video" />
            {isRecording && <div className="live-dot">REC</div>}
          </div>
          <div className="recording-controls">
            {!isRecording ? (
              <button className="btn-record" onClick={startRecording}>Start Recording</button>
            ) : (
              <button className="btn-stop" onClick={stopRecording}>Stop Recording</button>
            )}
            <div className="status-row">
              <span>Elapsed: {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</span>
              <span className="mic-meter">
                Mic level
                <div className="mic-bar"><div style={{ width: `${micLevel}%` }} /></div>
              </span>
            </div>
            {previewUrl && (
              <div className="playback">
                <video src={previewUrl} controls className="preview-video mini" />
                <a href={previewUrl} download="mock-recording.webm" className="btn-download">Download</a>
              </div>
            )}
          </div>
        </div>

        <div className="recordings-list">
          <h3>My Recordings ({recordings.length})</h3>
          {recordings.length === 0 ? (
            <p className="empty-state">No recordings yet.</p>
          ) : (
            recordings.map((recording) => (
              <div key={recording._id} className="recording-item">
                <div className="thumbnail"><div className="thumbnail-placeholder">REC</div></div>
                <div className="recording-info">
                  <h4>{recording.title}</h4>
                  <p className="date">{new Date(recording.createdAt).toLocaleString()}</p>
                  <p className="duration">{recording.duration || 0}s</p>
                </div>
                <div className="recording-score">{recording.analysisMetrics.overallScore}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
