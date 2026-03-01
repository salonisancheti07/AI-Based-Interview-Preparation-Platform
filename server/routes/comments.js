const express = require('express');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get comments for a problem
router.get('/:problemId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const skip = (page - 1) * limit;

    let sortOptions = { createdAt: -1 };
    if (sort === 'popular') sortOptions = { upvotes: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };

    const comments = await Comment.find({ problemId: req.params.problemId })
      .populate('userId', 'name avatar')
      .populate('replies.userId', 'name avatar')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Comment.countDocuments({ problemId: req.params.problemId });

    res.json({
      success: true,
      comments,
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

// Post a comment
router.post('/', auth, async (req, res) => {
  try {
    const { problemId, content, type, language, code } = req.body;

    const comment = new Comment({
      problemId,
      userId: req.userId,
      content,
      type: type || 'general',
      language: language || 'none',
      code
    });

    await comment.save();
    await comment.populate('userId', 'name avatar');

    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upvote comment
router.post('/:commentId/upvote', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userIndex = comment.upvotes.indexOf(req.userId);
    if (userIndex > -1) {
      comment.upvotes.splice(userIndex, 1);
    } else {
      comment.upvotes.push(req.userId);
      const downvoteIndex = comment.downvotes.indexOf(req.userId);
      if (downvoteIndex > -1) comment.downvotes.splice(downvoteIndex, 1);
    }

    await comment.save();
    res.json({ success: true, upvotes: comment.upvotes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reply to comment
router.post('/:commentId/reply', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    comment.replies.push({
      userId: req.userId,
      content,
      createdAt: new Date()
    });

    await comment.save();
    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
