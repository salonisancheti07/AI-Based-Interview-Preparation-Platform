const express = require('express');
const { authOptional } = require('../middleware/auth');
const router = express.Router();

// In-memory mock store (keeps UI working even without DB)
const mockNotes = [
  { id: 'demo-1', title: 'Amazon Interview - Round 1', category: 'System Design', company: 'Amazon', date: '2024-01-20', content: 'Clarify scale, QPS, data model. Design read/write path and cache.' },
  { id: 'demo-2', title: 'Google Technical', category: 'DSA', company: 'Google', date: '2024-01-18', content: 'Asked about optimization techniques and algorithms.' }
];

const normalizeNote = (note = {}) => ({
  id: note.id,
  title: note.title || 'Untitled',
  category: note.category || note.company || 'General',
  company: note.company || '',
  date: note.date || new Date().toISOString().split('T')[0],
  content: note.content || ''
});

// Get all notes
router.get('/', authOptional, async (req, res) => {
  try {
    res.json({ success: true, data: mockNotes.map(normalizeNote) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create note
router.post('/create', authOptional, async (req, res) => {
  try {
    const { title, company, category, content } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newNote = {
      id,
      title,
      company,
      category,
      date: new Date().toISOString().split('T')[0],
      content
    };
    mockNotes.push(newNote);
    res.json({ success: true, data: normalizeNote(newNote), message: 'Note created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete note
router.delete('/:noteId', authOptional, async (req, res) => {
  try {
    const { noteId } = req.params;
    const index = mockNotes.findIndex(n => n.id == noteId);
    if (index > -1) {
      mockNotes.splice(index, 1);
      res.json({ success: true, message: 'Note deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Note not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
