const mongoose = require('mongoose');

const videoRecordingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockInterview'
  },

  // Recording Details
  recordingTitle: String,
  recordingDescription: String,
  recordingType: { type: String, enum: ['full-interview', 'question', 'practice'] },

  // Video Information
  videoUrl: String,
  videoThumbnailUrl: String,
  videoDuration: Number, // in seconds
  videoSize: Number, // in MB
  videoCodec: String,
  resolution: { type: String, enum: ['720p', '1080p', '480p'] },

  // Audio Information
  audioUrl: String,
  audioTranscript: String,
  audioQuality: String,

  // Question Details
  questionIndex: Number,
  question: String,
  category: String,
  difficulty: String,

  // Performance Metrics from Video
  videoAnalysis: {
    eyeContact: { type: Number, default: 0 }, // 0-100
    confidence: { type: Number, default: 0 }, // 0-100
    clarity: { type: Number, default: 0 }, // 0-100
    paceOfSpeech: { type: Number, default: 0 }, // 0-100
    gestures: { type: Number, default: 0 }, // 0-100
    facialExpressions: { type: Number, default: 0 }, // 0-100
    fillerWords: Number,
    pausesDuration: Number,
    smileFrequency: Number
  },

  // Answer Details
  answerText: String,
  answerQuality: { type: Number, default: 0 }, // 0-100
  timeSpent: Number, // in seconds

  // AI Review Comments
  aiReviewComments: {
    strengths: [String],
    improvements: [String],
    suggestions: [String],
    overallFeedback: String
  },

  // User Self-Feedback
  selfReview: {
    userRating: { type: Number, min: 1, max: 5 },
    userComments: String,
    selfAssessment: String,
    areasToImprove: [String]
  },

  // Playback & Analytics
  viewCount: { type: Number, default: 0 },
  lastViewedAt: Date,
  sharedWith: [mongoose.Schema.Types.ObjectId], // User IDs shared with
  isPublic: { type: Boolean, default: false },

  // Comparison
  previousRecordingId: mongoose.Schema.Types.ObjectId,
  improvementScore: Number, // vs previous

  // Tags & Organization
  tags: [String],
  folder: String,
  favorite: { type: Boolean, default: false },

  // Storage Info
  storageProvider: { type: String, enum: ['Local', 'AWS', 'Google Cloud'] },
  storageKey: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

videoRecordingSchema.index({ userId: 1, createdAt: -1 });
videoRecordingSchema.index({ interviewId: 1 });
videoRecordingSchema.index({ userId: 1, favorite: 1 });

module.exports = mongoose.model('VideoRecording', videoRecordingSchema);
