const express = require('express');
const router = express.Router();

// In-memory notes (per server process). For demo only.
const notes = [];

// Get all notes
router.get('/notes', (req, res) => {
  res.json({ success: true, notes });
});

// Add a note
router.post('/notes', (req, res) => {
  const { text, user = 'Anonymous' } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Note text required' });
  }
  const note = {
    id: Date.now().toString(),
    text: text.trim(),
    user,
    createdAt: new Date().toISOString()
  };
  notes.unshift(note); // newest first
  res.status(201).json({ success: true, note });
});

module.exports = router;
