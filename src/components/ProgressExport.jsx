import React, { useEffect, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/ProgressExport.css';

const getPayload = (response) => (response && typeof response === 'object' && 'data' in response ? response.data : response);

const normalizeReport = (raw = {}, index = 0) => ({
  _id: raw.id || `p-${index}`,
  exportType: (raw.format || 'PDF').toLowerCase(),
  reportPeriod: { description: raw.name || 'Progress Report' },
  createdAt: raw.createdAt || new Date().toISOString(),
  overallStats: {
    totalInterviews: raw.totalInterviews || 0,
    timeInvestedHours: raw.timeInvestedHours || 0,
    averageScore: raw.averageScore || 0
  },
  status: raw.status || 'ready'
});

export default function ProgressExport() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [exportType, setExportType] = useState('pdf');
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/progress-export');
        const payload = getPayload(response) || [];
        const normalized = payload.map(normalizeReport);
        setReports(normalized);
        setSelectedReport(normalized[0] || null);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleGenerateReport = async (period) => {
    try {
      const response = await axios.post('/api/progress-export/generate', {
        format: exportType.toUpperCase(),
        type: period
      });
      const payload = getPayload(response);
      if (payload) {
        const report = normalizeReport(payload, reports.length);
        setReports((prev) => [report, ...prev]);
        setSelectedReport(report);
      }
    } catch (err) {
      alert(`Error generating report: ${err.message}`);
    }
  };

  const inferExtension = (contentType = '') => {
    if (contentType.includes('pdf')) return 'pdf';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'xlsx';
    if (contentType.includes('csv')) return 'csv';
    if (contentType.includes('word')) return 'docx';
    return exportType || 'pdf';
  };

  const blobLooksLikeError = (blob, contentType) => {
    const isText = /json|text|html/.test(contentType);
    return isText || (blob?.size || 0) < 200; // tiny payload usually means an error message
  };

  const handleDownload = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/progress-export/${reportId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Download failed');
      }

      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const contentType = response.headers.get('content-type') || 'application/pdf';
      const ext = inferExtension(contentType);
      const fileName = match?.[1] || `progress-report-${reportId}.${ext}`;

      const blob = await response.blob();

       // If backend returned an error message instead of a file, surface it to the user.
      if (blobLooksLikeError(blob, contentType)) {
        const text = await blob.text();
        alert(text || 'The server returned an empty file. Please try regenerating the report.');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert(`Error downloading report: ${err?.message || 'Download failed'}`);
    }
  };

  const handleExportCsv = async () => {
    try {
      const resp = await axios.get('/api/submissions/export/csv');
      const csv = resp?.csv || resp?.data || '';
      if (!csv) {
        alert('No CSV returned.');
        return;
      }
      setCsvData(csv);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attempts.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(`Error exporting CSV: ${err.message}`);
    }
  };

  if (loading) return <div className="loading">Loading reports...</div>;

  return (
    <div className="progress-export-container">
      <div className="export-header">
        <h1>Progress Export and Reports</h1>
        <p>Generate and download progress snapshots.</p>
        <button className="btn-download-card" onClick={handleExportCsv}>Download Attempts CSV</button>
      </div>
      <div className="export-main">
        <div className="generate-section">
          <h3>Generate New Report</h3>
          <div className="report-options">
            <div className="option-group">
              <label>Export Format:</label>
              <select value={exportType} onChange={(e) => setExportType(e.target.value)} className="select-format">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="document">Document</option>
                <option value="portfolio">Portfolio</option>
              </select>
            </div>
            <div className="period-buttons">
              <label>Select Period:</label>
              <div className="button-group">
                <button className="btn-period" onClick={() => handleGenerateReport('week')}>This Week</button>
                <button className="btn-period" onClick={() => handleGenerateReport('month')}>This Month</button>
                <button className="btn-period" onClick={() => handleGenerateReport('quarter')}>This Quarter</button>
                <button className="btn-period" onClick={() => handleGenerateReport('year')}>This Year</button>
              </div>
            </div>
          </div>
        </div>

        <div className="reports-section">
          <h3>My Reports ({reports.length})</h3>
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report._id} className={`report-card ${selectedReport?._id === report._id ? 'selected' : ''}`} onClick={() => setSelectedReport(report)}>
                <div className="report-info">
                  <h4>{report.reportPeriod.description}</h4>
                  <p className="report-date">{new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <button className="btn-download-card" onClick={(e) => { e.stopPropagation(); handleDownload(report._id); }}>
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedReport && (
        <div className="detailed-report">
          <div className="report-header">
            <h2>Report Details</h2>
            <button className="btn-close" onClick={() => setSelectedReport(null)}>X</button>
          </div>
          <div className="report-overall">
            <h3>Overall Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card"><h4>Total Interviews</h4><p className="big-number">{selectedReport.overallStats.totalInterviews}</p></div>
              <div className="stat-card"><h4>Time Invested</h4><p className="big-number">{selectedReport.overallStats.timeInvestedHours}h</p></div>
              <div className="stat-card"><h4>Average Score</h4><p className="big-number">{selectedReport.overallStats.averageScore}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
