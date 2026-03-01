const express = require('express');
const router = express.Router();

// Mock video recordings
const mockVideos = [
  { id: 1, title: 'Mock Interview - Amazon', date: '2024-01-20', duration: '45m', score: 82, status: 'completed' },
  { id: 2, title: 'Mock Interview - Google', date: '2024-01-18', duration: '50m', score: 75, status: 'completed' }
];

router.get('/list', async (req, res) => {
  try {
    res.json({ success: true, data: mockVideos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const { title } = req.body;
    const video = {
      id: mockVideos.length + 1,
      title: title || 'Untitled Recording',
      date: new Date().toISOString().split('T')[0],
      duration: '0m',
      score: 0,
      status: 'processing'
    };
    mockVideos.push(video);
    res.json({ success: true, data: video, message: 'Video uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:videoId', async (req, res) => {
  try {
    const idx = mockVideos.findIndex(v => v.id == req.params.videoId);
    if (idx > -1) {
      mockVideos.splice(idx, 1);
      res.json({ success: true, message: 'Video deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Video not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
