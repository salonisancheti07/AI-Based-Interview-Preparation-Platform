const express = require('express');
const PeerPractice = require('../models/PeerPractice');
const auth = require('../middleware/auth');
const router = express.Router();

// Get available peer practice sessions
// Publicly list active sessions (auth optional so landing/demo still works)
const { authOptional } = require('../middleware/auth');

router.get('/', authOptional, async (req, res) => {
  try {
    const sessions = await PeerPractice.find({
      status: { $in: ['Scheduled', 'In Progress'] }
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new peer practice session
router.post('/create', auth, async (req, res) => {
  try {
    const { sessionTitle, sessionDescription, sessionType, difficulty, topic, duration, maxParticipants, isPublic = true } = req.body;
    
    const session = new PeerPractice({
      createdBy: req.userId,
      creatorName: req.user?.name || 'Anonymous',
      sessionTitle,
      sessionDescription,
      sessionType,
      difficulty,
      topic,
      duration,
      maxParticipants: maxParticipants || 2,
      isPublic,
      participants: [{
        userId: req.userId,
        userName: req.user?.name || 'Anonymous',
        role: 'interviewer',
        joinedAt: new Date()
      }]
    });

    await session.save();
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Join peer practice session
router.post('/:sessionId/join', auth, async (req, res) => {
  try {
    const session = await PeerPractice.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.participants.length >= session.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Session is full' });
    }

    if (session.status !== 'Scheduled') {
      return res.status(400).json({ success: false, message: 'Session is not available for joining' });
    }

    // Check if user already joined
    const alreadyJoined = session.participants.some(p => p.userId.toString() === req.userId);
    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'Already joined this session' });
    }

    // Add participant
    session.participants.push({
      userId: req.userId,
      userName: req.user?.name || 'Anonymous',
      role: 'candidate',
      joinedAt: new Date()
    });

    // If session is now full, start it
    if (session.participants.length >= session.maxParticipants) {
      session.status = 'In Progress';
      session.startTime = new Date();
    }

    await session.save();
    res.json({ success: true, message: 'Joined session successfully', data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit feedback for peer practice
router.post('/:sessionId/feedback', auth, async (req, res) => {
  try {
    const { toUserId, feedbackText, rating, category } = req.body;
    
    const session = await PeerPractice.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if user participated in this session
    const isParticipant = session.participants.some(p => p.userId.toString() === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to provide feedback for this session' });
    }

    session.feedback.push({
      from: req.userId,
      to: toUserId,
      feedbackText,
      rating,
      category,
      createdAt: new Date()
    });

    await session.save();
    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user's peer practice history
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await PeerPractice.find({
      'participants.userId': req.userId,
      status: 'Completed'
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
