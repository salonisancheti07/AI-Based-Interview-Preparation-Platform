const express = require('express');
const router = express.Router();

// Mock reports
const mockReports = [
  {
    id: 1,
    interviewType: 'Amazon',
    date: '2024-01-20',
    score: 82,
    strengths: ['Problem Solving', 'Communication'],
    weaknesses: ['System Design Thinking'],
    duration: '45m'
  },
  {
    id: 2,
    interviewType: 'Google',
    date: '2024-01-18',
    score: 75,
    strengths: ['Coding Skills', 'Logic'],
    weaknesses: ['Time Complexity Analysis', 'Follow-ups'],
    duration: '50m'
  }
];

router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: mockReports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:reportId', async (req, res) => {
  try {
    const report = mockReports.find(r => r.id == req.params.reportId);
    if (report) {
      res.json({ success: true, data: report });
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
