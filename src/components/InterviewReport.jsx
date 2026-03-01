import React, { useEffect, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/InterviewReport.css';

const getPayload = (response) => (response && typeof response === 'object' && 'data' in response ? response.data : response);

const normalizeReport = (raw = {}, index = 0) => ({
  _id: raw.id || `r-${index}`,
  reportTitle: raw.title || `${raw.interviewType || 'Interview'} Report`,
  interviewType: raw.interviewType || 'General',
  targetRole: raw.targetRole || 'Software Engineer',
  createdAt: raw.date || new Date().toISOString(),
  scores: {
    overall: raw.score || 0,
    readiness: raw.score || 0,
    communication: Math.max(0, (raw.score || 0) - 5),
    technical: raw.score || 0,
    confidence: Math.max(0, (raw.score || 0) - 8)
  },
  performanceSummary: {
    strengths: raw.strengths || [],
    weaknesses: raw.weaknesses || []
  }
});

export default function InterviewReport() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/interview-report');
        const payload = getPayload(response) || [];
        const normalized = payload.map(normalizeReport);
        setReports(normalized);
        setSelectedReport(normalized[0] || null);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Could not load reports. Showing samples.');
        const fallback = [
          normalizeReport({ id: 'local-1', interviewType: 'System Design', score: 78, strengths: ['Clarity', 'Trade-offs'], weaknesses: ['Capacity estimates'] }, 0),
          normalizeReport({ id: 'local-2', interviewType: 'DSA', score: 85, strengths: ['Optimal solutions'], weaknesses: ['Explain aloud'] }, 1)
        ];
        setReports(fallback);
        setSelectedReport(fallback[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="loading">Loading reports...</div>;

  return (
    <div className="interview-report-container">
      <div className="report-header">
        <h1>Interview Reports</h1>
        <p>Review score trends and strengths.</p>
        {error && <p className="error-banner">{error}</p>}
      </div>
      <div className="report-main">
        <div className="report-sidebar">
          <h3>Recent Reports</h3>
          {reports.map((report) => (
            <div key={report._id} className={`report-item ${selectedReport?._id === report._id ? 'active' : ''}`} onClick={() => setSelectedReport(report)}>
              <div className="report-date">{new Date(report.createdAt).toLocaleDateString()}</div>
              <h4>{report.reportTitle}</h4>
              <div className="score-pill">{report.scores.overall}</div>
            </div>
          ))}
        </div>
        {selectedReport ? (
          <div className="report-content">
            <div className="report-title-section">
              <h2>{selectedReport.reportTitle}</h2>
              <div className="report-meta">
                <span>Type: {selectedReport.interviewType}</span>
                <span>Role: {selectedReport.targetRole}</span>
                <span>Date: {new Date(selectedReport.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="overall-scores">
              <div className="score-card main-score"><h3>Overall Score</h3><div className="large-score">{selectedReport.scores.overall}</div><p>/100</p></div>
              <div className="score-card"><h3>Communication</h3><div className="score">{selectedReport.scores.communication}</div></div>
              <div className="score-card"><h3>Technical</h3><div className="score">{selectedReport.scores.technical}</div></div>
              <div className="score-card"><h3>Confidence</h3><div className="score">{selectedReport.scores.confidence}</div></div>
            </div>
            <div className="strengths-weaknesses">
              <div className="strengths">
                <h3>Strengths</h3>
                <ul>{selectedReport.performanceSummary.strengths.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
              </div>
              <div className="weaknesses">
                <h3>Areas to Improve</h3>
                <ul>{selectedReport.performanceSummary.weaknesses.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state"><p>Select a report</p></div>
        )}
      </div>
    </div>
  );
}
