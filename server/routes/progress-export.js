const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');
const Submission = require('../models/Submission');
const User = require('../models/User');

// In-memory placeholder list; in a real app this would be user-specific DB docs
const mockExports = [
  { id: 1, name: 'Progress Report - Jan 2024', format: 'PDF', createdAt: '2024-01-20', size: '2.4MB' },
  { id: 2, name: 'Interview Analytics', format: 'CSV', createdAt: '2024-01-15', size: '1.2MB' }
];

// Escape parentheses for PDF text
const pdfEscape = (str = '') => String(str).replace(/([()\\])/g, '\\$1');

const buildPdf = (title, lines) => {
  const chunks = [];
  const offsets = ['0000000000 65535 f \n']; // obj 0 free
  let size = 0;
  const add = (str) => { chunks.push(str); size += Buffer.byteLength(str, 'utf8'); };
  const addObj = (idx, body) => {
    offsets[idx] = String(size).padStart(10, '0') + ' 00000 n \n';
    add(`${idx} 0 obj\n${body}\nendobj\n`);
  };

  add('%PDF-1.4\n');
  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let y = 760;
  const contentLines = [
    `BT /F1 20 Tf 72 ${y} Td (${pdfEscape(title)}) Tj ET`
  ];
  y -= 28;
  lines.forEach((line) => {
    contentLines.push(`BT /F1 12 Tf 72 ${y} Td (${pdfEscape(line)}) Tj ET`);
    y -= 18;
  });
  const content = contentLines.join('\n');
  addObj(4, `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
  addObj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');

  const xrefStart = size;
  add('xref\n');
  add(`0 ${offsets.length}\n`);
  add(offsets.join(''));
  add('trailer\n');
  add(`<< /Size ${offsets.length} /Root 1 0 R >>\n`);
  add('startxref\n');
  add(`${xrefStart}\n`);
  add('%%EOF');

  return Buffer.from(chunks.join(''), 'utf8');
};

router.get('/', auth, async (req, res) => {
  try {
    // Return mock list but stamp "yours" with current date for UX
    const today = new Date().toISOString().split('T')[0];
    const userList = [
      { id: 999, name: 'Latest Progress Snapshot', format: 'PDF', createdAt: today, size: 'auto' },
      ...mockExports
    ];
    res.json({ success: true, data: userList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/generate', auth, async (req, res) => {
  try {
    const { format, type } = req.body;
    const exportData = {
      id: Date.now(),
      name: `Report - ${type || 'General'}`,
      format: format || 'PDF',
      createdAt: new Date().toISOString().split('T')[0],
      size: 'auto',
      status: 'ready'
    };
    res.json({ success: true, data: exportData, message: 'Export generated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:reportId/download', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const progress = await Progress.findOne({ userId: req.userId }) || {};
    const submissions = await Submission.find({ userId: req.userId });

    const solved = progress.problemsSolved?.length || 0;
    const attempted = progress.problemsStarted?.length || 0;
    const accuracy = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;
    const streak = progress.streakData?.currentStreak || 0;
    const longestStreak = progress.streakData?.longestStreak || 0;
    const totalMinutes = progress.totalTimeSpent || 0;

    const topCategories = Object.entries(progress.categoryProgress || {})
      .slice(0, 3)
      .map(([cat, vals]) => `${cat}: ${vals.solved || 0} solved / ${vals.attempted || 0} attempted`);

    const topDifficulties = Object.entries(progress.difficultyProgress || {})
      .map(([diff, vals]) => `${diff}: ${vals.solved || 0}/${vals.attempted || 0}`);

    const lines = [
      `User: ${user?.name || user?.fullName || 'Unknown'}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Solved: ${solved} | Attempted: ${attempted} | Accuracy: ${accuracy}%`,
      `Streak: ${streak} (Longest: ${longestStreak})`,
      `Time Practiced: ${Math.round(totalMinutes)} mins (~${Math.round(totalMinutes / 60)} hrs)`,
      `Submissions: ${submissions.length} (Accepted: ${submissions.filter(s => s.status === 'Accepted').length})`,
      `Rank: ${user?.rank || user?.statistics?.rank || 'N/A'}`,
      '--- Categories ---',
      ...(topCategories.length ? topCategories : ['No category data yet']),
      '--- Difficulty ---',
      ...(topDifficulties.length ? topDifficulties : ['No difficulty data yet'])
    ];

    const pdf = buildPdf('Progress Report', lines);
    const fileName = `progress-report-${req.params.reportId || 'export'}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdf.length
    });
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
