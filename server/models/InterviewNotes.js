const mongoose = require('mongoose');

const interviewNotesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Note Organization
  title: { type: String, required: true },
  description: String,
  category: { 
    type: String, 
    enum: ['Topic', 'Company', 'Role', 'Interview-Prep', 'Concept', 'Personal'] 
  },

  // Content
  content: String, // Main note content
  formattedContent: String, // Rich text format
  tags: [String],

  // Related Items
  linkedCompanies: [String],
  linkedRoles: [String],
  linkedTopics: [String],
  linkedInterviews: [mongoose.Schema.Types.ObjectId], // Links to mock interviews

  // Bookmarks & Highlights
  bookmarks: [{
    title: String,
    content: String,
    position: Number,
    createdAt: { type: Date, default: Date.now }
  }],

  highlights: [{
    text: String,
    color: { type: String, enum: ['yellow', 'blue', 'green', 'red', 'purple'] },
    position: Number,
    createdAt: { type: Date, default: Date.now }
  }],

  // Flashcards from Notes
  flashcards: [{
    question: String,
    answer: String,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    reviewed: { type: Boolean, default: false },
    reviewCount: { type: Number, default: 0 },
    lastReviewedAt: Date,
    createdAt: { type: Date, default: Date.now }
  }],

  // Sharing & Collaboration
  isShared: { type: Boolean, default: false },
  sharedWith: [mongoose.Schema.Types.ObjectId],
  sharedAt: Date,
  canEdit: [mongoose.Schema.Types.ObjectId],
  canView: [mongoose.Schema.Types.ObjectId],

  // Folder Organization
  folder: String,
  parentNoteId: mongoose.Schema.Types.ObjectId, // For nested notes

  // Metadata
  importance: { type: Number, min: 1, max: 5, default: 3 }, // 1-5 star rating
  favorite: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },

  // Statistics
  wordCount: { type: Number, default: 0 },
  readingTime: { type: Number, default: 0 }, // in minutes
  viewCount: { type: Number, default: 0 },
  lastAccessedAt: Date,

  // References & Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: Date
  }],

  // AI Suggestions
  aiSuggestions: {
    relatedTopics: [String],
    recommendedReadings: [String],
    practiceQuestions: [String],
    studySuggestions: [String]
  },

  // Reminders
  reminders: [{
    reminderText: String,
    dueDate: Date,
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['Low', 'Medium', 'High'] }
  }],

  // Version History
  versions: [{
    versionNumber: Number,
    content: String,
    changedAt: Date,
    changesSummary: String
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

interviewNotesSchema.index({ userId: 1, createdAt: -1 });
interviewNotesSchema.index({ userId: 1, category: 1 });
interviewNotesSchema.index({ tags: 1 });
interviewNotesSchema.index({ userId: 1, isPinned: 1 });

module.exports = mongoose.model('InterviewNotes', interviewNotesSchema);
