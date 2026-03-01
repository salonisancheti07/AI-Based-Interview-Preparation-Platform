const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import Models
const ResumeBuilder = require('../models/ResumeBuilder');
const InterviewReport = require('../models/InterviewReport');
const CompanyPrep = require('../models/CompanyPrep');
const PeerPractice = require('../models/PeerPractice');
const Gamification = require('../models/Gamification');
const VideoRecording = require('../models/VideoRecording');
const InterviewNotes = require('../models/InterviewNotes');
const QuestionRecommender = require('../models/QuestionRecommender');
const QuickPractice = require('../models/QuickPractice');
const ProgressExport = require('../models/ProgressExport');

/* ==================== RESUME BUILDER ROUTES ==================== */

// Create resume
router.post('/resume/create', auth, async (req, res) => {
  try {
    const resume = new ResumeBuilder({
      userId: req.userId,
      ...req.body
    });
    await resume.save();
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's resumes
router.get('/resume', auth, async (req, res) => {
  try {
    const resumes = await ResumeBuilder.find({ userId: req.userId });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update resume
router.put('/resume/:id', auth, async (req, res) => {
  try {
    const resume = await ResumeBuilder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export resume to PDF
router.post('/resume/export-pdf', auth, async (req, res) => {
  try {
    // PDF generation logic here
    res.json({ message: 'PDF exported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== INTERVIEW REPORT ROUTES ==================== */

// Create report
router.post('/interview-report', auth, async (req, res) => {
  try {
    const report = new InterviewReport({
      userId: req.userId,
      ...req.body
    });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's reports
router.get('/interview-report', auth, async (req, res) => {
  try {
    const reports = await InterviewReport.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific report
router.get('/interview-report/:id', auth, async (req, res) => {
  try {
    const report = await InterviewReport.findById(req.params.id);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== COMPANY PREP ROUTES ==================== */

// Get all companies
router.get('/company-prep', async (req, res) => {
  try {
    const companies = await CompanyPrep.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get company details
router.get('/company-prep/:id', async (req, res) => {
  try {
    const company = await CompanyPrep.findById(req.params.id);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add user experience
router.post('/company-prep/:id/experience', auth, async (req, res) => {
  try {
    const company = await CompanyPrep.findByIdAndUpdate(
      req.params.id,
      { $push: { userExperiences: req.body } },
      { new: true }
    );
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== PEER PRACTICE ROUTES ==================== */

// Create session
router.post('/peer-practice/create', auth, async (req, res) => {
  try {
    const session = new PeerPractice({
      participants: [{ userId: req.userId, role: 'initiator' }],
      ...req.body
    });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sessions
router.get('/peer-practice', auth, async (req, res) => {
  try {
    const sessions = await PeerPractice.find({
      'participants.userId': req.userId
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join session
router.post('/peer-practice/:id/join', auth, async (req, res) => {
  try {
    const session = await PeerPractice.findByIdAndUpdate(
      req.params.id,
      { $push: { participants: { userId: req.userId, role: req.body.role } } },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit answer
router.post('/peer-practice/:id/submit-answer', auth, async (req, res) => {
  try {
    const session = await PeerPractice.findByIdAndUpdate(
      req.params.id,
      { $push: { candidateResponses: req.body } },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== GAMIFICATION ROUTES ==================== */

// Get user stats
router.get('/gamification/stats', auth, async (req, res) => {
  try {
    const stats = await Gamification.findOne({ userId: req.userId });
    if (!stats) {
      const newStats = new Gamification({ userId: req.userId });
      await newStats.save();
      return res.json(newStats);
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get badges
router.get('/gamification/badges', auth, async (req, res) => {
  try {
    const user = await Gamification.findOne({ userId: req.userId });
    res.json(user.badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get leaderboard
router.get('/gamification/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Gamification.find()
      .sort({ allTimePoints: -1 })
      .limit(50);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Award badge
router.post('/gamification/award-badge', auth, async (req, res) => {
  try {
    const user = await Gamification.findOneAndUpdate(
      { userId: req.userId },
      { $push: { badges: req.body } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== VIDEO RECORDING ROUTES ==================== */

// Upload recording
router.post('/video-recording/upload', auth, async (req, res) => {
  try {
    const recording = new VideoRecording({
      userId: req.userId,
      ...req.body
    });
    await recording.save();
    res.json(recording);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recordings
router.get('/video-recording/list', auth, async (req, res) => {
  try {
    const recordings = await VideoRecording.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(recordings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recording details
router.get('/video-recording/:id', auth, async (req, res) => {
  try {
    const recording = await VideoRecording.findById(req.params.id);
    res.json(recording);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add AI review
router.post('/video-recording/:id/ai-review', auth, async (req, res) => {
  try {
    const recording = await VideoRecording.findByIdAndUpdate(
      req.params.id,
      { aiReview: req.body },
      { new: true }
    );
    res.json(recording);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== INTERVIEW NOTES ROUTES ==================== */

// Create note
router.post('/interview-notes/create', auth, async (req, res) => {
  try {
    const note = new InterviewNotes({
      userId: req.userId,
      ...req.body
    });
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notes
router.get('/interview-notes', auth, async (req, res) => {
  try {
    const notes = await InterviewNotes.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update note
router.put('/interview-notes/:id', auth, async (req, res) => {
  try {
    const note = await InterviewNotes.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete note
router.delete('/interview-notes/:id', auth, async (req, res) => {
  try {
    await InterviewNotes.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add bookmark
router.post('/interview-notes/:id/bookmark', auth, async (req, res) => {
  try {
    const note = await InterviewNotes.findByIdAndUpdate(
      req.params.id,
      { $push: { bookmarks: req.body } },
      { new: true }
    );
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== QUESTION RECOMMENDER ROUTES ==================== */

// Get recommendations
router.get('/question-recommender/suggestions', auth, async (req, res) => {
  try {
    const style = req.query.style || 'adaptive';
    const recommender = await QuestionRecommender.findOne({ userId: req.userId });
    
    if (!recommender) {
      const newRecommender = new QuestionRecommender({ userId: req.userId, recommendationStyle: style });
      await newRecommender.save();
      return res.json(newRecommender);
    }
    
    res.json(recommender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get learning insights
router.get('/question-recommender/insights', auth, async (req, res) => {
  try {
    const recommender = await QuestionRecommender.findOne({ userId: req.userId });
    res.json(recommender.learningInsights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update recommendations
router.post('/question-recommender/update', auth, async (req, res) => {
  try {
    const recommender = await QuestionRecommender.findOneAndUpdate(
      { userId: req.userId },
      { ...req.body },
      { new: true }
    );
    res.json(recommender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== QUICK PRACTICE ROUTES ==================== */

// Start session
router.get('/quick-practice/start/:duration', auth, async (req, res) => {
  try {
    const duration = req.params.duration;
    const session = new QuickPractice({
      userId: req.userId,
      duration,
      status: 'in_progress'
    });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit answer
router.post('/quick-practice/submit-answer', auth, async (req, res) => {
  try {
    res.json({ isCorrect: true, feedback: 'Good answer!', points: 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End session
router.post('/quick-practice/end-session', auth, async (req, res) => {
  try {
    const { sessionStats, sessionMode } = req.body;
    const session = new QuickPractice({
      userId: req.userId,
      duration: sessionMode,
      ...sessionStats,
      status: 'completed'
    });
    await session.save();
    res.json({
      finalScore: Math.round((sessionStats.questionsCorrect / sessionStats.questionsAttempted) * 100),
      accuracy: Math.round((sessionStats.questionsCorrect / sessionStats.questionsAttempted) * 100),
      questionsAnswered: sessionStats.questionsAttempted,
      percentileRank: 75
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==================== PROGRESS EXPORT ROUTES ==================== */

// Get exports
router.get('/progress-export', auth, async (req, res) => {
  try {
    const exports = await ProgressExport.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(exports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate report
router.post('/progress-export/generate', auth, async (req, res) => {
  try {
    const { period, exportType } = req.body;
    const report = new ProgressExport({
      userId: req.userId,
      exportType,
      reportPeriod: { period }
    });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download report
router.get('/progress-export/:id/download', auth, async (req, res) => {
  try {
    const report = await ProgressExport.findById(req.params.id);

    // Generate a lightweight PDF on the fly so the download is a real file
    const generatePdf = () => {
      const chunks = [];
      const offsets = ['0000000000 65535 f \n']; // object 0 (free)
      let size = 0;
      const add = (str) => {
        chunks.push(str);
        size += Buffer.byteLength(str, 'utf8');
      };
      const addObj = (index, body) => {
        offsets[index] = String(size).padStart(10, '0') + ' 00000 n \n';
        add(`${index} 0 obj\n${body}\nendobj\n`);
      };

      add('%PDF-1.4\n');
      addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
      addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
      addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

      const streamContent = 'BT /F1 18 Tf 72 720 Td (Progress Report Ready) Tj ET';
      addObj(
        4,
        `<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream`
      );
      addObj(
        3,
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'
      );

      const xrefStart = size;
      add('xref\n');
      add(`0 ${offsets.length}\n`);
      add(offsets.join(''));
      add(
        'trailer\n' +
        `<< /Size ${offsets.length} /Root 1 0 R >>\n` +
        'startxref\n' +
        `${xrefStart}\n` +
        '%%EOF'
      );

      return Buffer.from(chunks.join(''), 'utf8');
    };

    const pdfBuffer = generatePdf();
    const fileName = `progress-report-${report?._id || 'export'}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
