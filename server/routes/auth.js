const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'interview-prep-jwt-secret-2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// GitHub OAuth strategy
passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: `${process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback'}`
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username,
          email,
          authProvider: 'github',
          githubId: profile.id,
          avatar: profile.photos?.[0]?.value || 'U',
          rank: 'Beginner'
        });
      } else if (!user.githubId) {
        user.githubId = profile.id;
        user.authProvider = 'github';
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Start GitHub OAuth (stateless)
router.get('/github/start', passport.authenticate('github', { scope: ['user:email'], session: false }));

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?auth=github_failed`
  }),
  (req, res, next) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      );
      const redirectUrl = `${FRONTEND_URL}/dashboard?token=${token}`;
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('GitHub callback error:', err);
      return next(err);
    }
  }
);

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letters')
    .matches(/\d/).withMessage('Password must contain numbers')
    .matches(/[@$!%*?&]/).withMessage('Password must contain special characters (@$!%*?&)')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, targetRole } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      targetRole,
      authProvider: 'local'
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Continue with Google.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const {
      name,
      bio,
      avatar,
      banner,
      resume,
      preferredLanguages,
      targetRole,
      experienceLevel,
      companyGoal
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name,
        bio,
        avatar,
        banner,
        resume,
        preferredLanguages,
        targetRole,
        experienceLevel,
        companyGoal
      },
      { new: true }
    );

    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/preferences', auth, async (req, res) => {
  try {
    const {
      emailNotifications,
      dailyReminders,
      shareProgress,
      darkMode,
      weeklyGoal
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        preferences: {
          emailNotifications: Boolean(emailNotifications),
          dailyReminders: Boolean(dailyReminders),
          shareProgress: Boolean(shareProgress),
          darkMode: Boolean(darkMode),
          weeklyGoal: Number(weeklyGoal) || 5
        }
      },
      { new: true }
    );

    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letters')
    .matches(/\d/).withMessage('Password must contain numbers')
    .matches(/[@$!%*?&]/).withMessage('Password must contain special characters (@$!%*?&)')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Password change is not available for this account.'
      });
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name required' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        authProvider: 'google',
        googleId: googleId || null,
        password: null,
        avatar: avatar || 'U',
        rank: 'Beginner'
      });
      await user.save();
    } else if (!user.googleId && googleId) {
      user.googleId = googleId;
      user.authProvider = user.authProvider || 'google';
      if (!user.password) user.authProvider = 'google';
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/upload-avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const user = await User.findByIdAndUpdate(req.userId, { avatar }, { new: true });
    res.json({
      success: true,
      message: 'Avatar updated successfully',
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
