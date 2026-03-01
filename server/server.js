const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');

// Load env variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const isDev = (process.env.NODE_ENV || 'development') === 'development';

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    if (isDev) return callback(null, true);
    return allowedOrigins.includes(origin)
      ? callback(null, true)
      : callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Security headers
app.use(helmet());

// Basic rate limiting: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai')); // 🤖 AI Features Routes
app.use('/api/company-prep', require('./routes/company-prep')); // mock company data first
app.use('/api/interview-notes', require('./routes/interview-notes')); // mock interview notes first
app.use('/api/peer-practice', require('./routes/peer-practice')); // mock peer practice first
app.use('/api/interview-report', require('./routes/interview-report')); // mock interview reports first
app.use('/api/question-recommender', require('./routes/question-recommender')); // mock recommender first
app.use('/api/progress-export', require('./routes/progress-export')); // mock progress exports first
app.use('/api', require('./routes/features')); // 🚀 Platform Feature Routes

// Feature Routes
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/video-recording', require('./routes/video-recording'));
app.use('/api/ai/insights', require('./routes/ai-insights'));
app.use('/api/progress-export', require('./routes/progress-export'));
app.use('/api/community', require('./routes/community'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running ✅', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join peer matching queue
  socket.on('join-peer-queue', (data) => {
    const { userId, interviewType, difficulty } = data;
    socket.userId = userId;
    socket.interviewType = interviewType;
    socket.difficulty = difficulty;
    socket.join('peer-queue');
    
    // Try to find a match
    findPeerMatch(socket, io);
  });

  // Handle peer interview messages
  socket.on('peer-message', (data) => {
    const { roomId, message, type } = data;
    socket.to(roomId).emit('peer-message', {
      from: socket.userId,
      message,
      type,
      timestamp: new Date()
    });
  });

  // Handle peer rating
  socket.on('rate-peer', (data) => {
    const { roomId, rating, feedback } = data;
    // Store rating in database
    socket.to(roomId).emit('peer-rated', { rating, feedback });
  });

  socket.on('leave-peer-interview', (data) => {
    const { roomId } = data;
    socket.leave(roomId);
    socket.to(roomId).emit('peer-left', { userId: socket.userId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Peer matching logic
function findPeerMatch(socket, io) {
  const queue = Array.from(io.sockets.adapter.rooms.get('peer-queue') || []);
  const waitingPeers = queue.filter(id => id !== socket.id);
  
  if (waitingPeers.length > 0) {
    // Find best match based on interview type and difficulty
    const bestMatch = waitingPeers.find(peerId => {
      const peerSocket = io.sockets.sockets.get(peerId);
      return peerSocket && 
             peerSocket.interviewType === socket.interviewType && 
             peerSocket.difficulty === socket.difficulty;
    });
    
    if (bestMatch) {
      const roomId = `peer-${socket.id}-${bestMatch}`;
      
      // Remove both from queue
      socket.leave('peer-queue');
      io.sockets.sockets.get(bestMatch).leave('peer-queue');
      
      // Join them to the same room
      socket.join(roomId);
      io.sockets.sockets.get(bestMatch).join(roomId);
      
      // Notify both users
      const peerSocket = io.sockets.sockets.get(bestMatch);
      io.to(roomId).emit('peer-matched', {
        roomId,
        participants: [
          { id: socket.userId, socketId: socket.id },
          { id: peerSocket.userId, socketId: bestMatch }
        ],
        interviewType: socket.interviewType,
        difficulty: socket.difficulty
      });
    }
  }
}

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket enabled for real-time features`);
});
