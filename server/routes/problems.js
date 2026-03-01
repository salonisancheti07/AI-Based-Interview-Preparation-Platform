const express = require('express');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all problems with filters
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (category && category !== 'all') query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const problems = await Problem.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-codeTemplates.solution -testCases'); // Don't send solutions yet

    const total = await Problem.countDocuments(query);

    res.json({
      success: true,
      problems,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single problem with full details
router.get('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.json({ success: true, problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get problem by category
router.get('/category/:category', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const problems = await Problem.find({ category: req.params.category })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-codeTemplates.solution -testCases');

    const total = await Problem.countDocuments({ category: req.params.category });

    res.json({
      success: true,
      problems,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Create problem (protected)
router.post('/', auth, async (req, res) => {
  try {
    // In production, check if user is admin
    const problem = new Problem(req.body);
    await problem.save();
    res.status(201).json({ success: true, problem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
