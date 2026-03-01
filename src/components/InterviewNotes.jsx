import React, { useEffect, useState } from 'react';
import axios from '../services/apiClient';
import '../styles/InterviewNotes.css';

const getPayload = (response) => {
  if (!response || typeof response !== 'object') return [];
  if ('data' in response && response.data !== undefined) return response.data;
  return response;
};

const normalizeNote = (raw = {}, index = 0) => ({
  _id: raw.id || `n-${index}`,
  title: raw.title || 'Untitled',
  category: raw.category || raw.company || 'General',
  content: raw.content || '',
  createdAt: raw.createdAt || raw.date || new Date().toISOString(),
  updatedAt: raw.updatedAt || raw.date || new Date().toISOString(),
  isPinned: Boolean(raw.isPinned),
  isFavorite: Boolean(raw.isFavorite),
  wordCount: (raw.content || '').split(/\s+/).filter(Boolean).length
});

export default function InterviewNotes() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'General' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [flashcards, setFlashcards] = useState({});
  const [summaries, setSummaries] = useState({});
  const [notice, setNotice] = useState('');
  const STORAGE_KEY = 'interviewNotesAI';

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get('/api/interview-notes');
        const payload = getPayload(response) || [];
        const normalized = payload.map(normalizeNote);
        setNotes(normalized);
        setSelectedNote(normalized[0] || null);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Could not load notes. Using local examples.');
        const fallback = [
          normalizeNote({ id: 'local-1', title: 'Sample Note', category: 'Behavioral', content: 'Use STAR. Keep answers concise.' }, 0),
          normalizeNote({ id: 'local-2', title: 'System Design Warmup', category: 'System Design', content: 'Clarify requirements, constraints, scale.' }, 1)
        ];
        setNotes(fallback);
        setSelectedNote(fallback[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  // restore cached AI outputs
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.summaries) setSummaries(saved.summaries);
      if (saved.flashcards) setFlashcards(saved.flashcards);
    } catch (e) {
      console.warn('Restore note cache failed', e);
    }
  }, []);

  // persist AI outputs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ summaries, flashcards }));
    } catch (e) {
      console.warn('Persist note cache failed', e);
    }
  }, [summaries, flashcards]);

  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required.');
      return;
    }
    try {
      const response = await axios.post('/api/interview-notes/create', formData);
      const payload = getPayload(response);
      if (payload) {
        const newNote = normalizeNote(payload, notes.length);
        setNotes((prev) => [newNote, ...prev]);
        setSelectedNote(newNote);
        setNotice('');
      }
    } catch (err) {
      const localNote = normalizeNote(
        { id: `local-${Date.now()}`, ...formData },
        notes.length
      );
      setNotes((prev) => [localNote, ...prev]);
      setSelectedNote(localNote);
      setNotice('Backend unreachable; saved locally only.');
    } finally {
      setFormData({ title: '', content: '', category: 'General' });
      setCreating(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`/api/interview-notes/${noteId}`);
      setNotes((prev) => prev.filter((note) => note._id !== noteId));
      if (selectedNote?._id === noteId) setSelectedNote(null);
      setNotice('');
    } catch (err) {
      setNotes((prev) => prev.filter((note) => note._id !== noteId));
      if (selectedNote?._id === noteId) setSelectedNote(null);
      setNotice('Backend unreachable; removed locally only.');
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSummarize = async (note) => {
    if (!note) return;
    if (summaries[note._id]) return; // cached
    try {
      const payload = getPayload(
        await axios.post('/api/ai/tutor/chat', {
          topic: note.category || 'Interview Notes',
          sessionType: 'summarize-note',
          message: `Summarize this note in 5 bullet points:\n${note.content}`
        })
      );
      setSummaries((prev) => ({ ...prev, [note._id]: payload?.response || 'No summary generated.' }));
    } catch (err) {
      alert(`Summarize failed: ${err.message}`);
    }
  };

  const handleFlashcards = async (note) => {
    if (!note) return;
    if (flashcards[note._id]) return; // cached
    try {
      const payload = getPayload(
        await axios.post('/api/ai/tutor/chat', {
          topic: note.category || 'Interview Notes',
          sessionType: 'flashcards',
          message: `Create 5 Q&A flashcards from this note. Return as bullet list "Q: ... A: ...":\n${note.content}`
        })
      );
      setFlashcards((prev) => ({ ...prev, [note._id]: payload?.response || 'No flashcards generated.' }));
    } catch (err) {
      alert(`Flashcards failed: ${err.message}`);
    }
  };

  if (loading) return <div className="loading">Loading notes...</div>;

  return (
    <div className="interview-notes-container">
      <div className="notes-header">
        <h1>Interview Notes</h1>
        <p>Store your prep insights and quick summaries.</p>
        {error && <p className="error-banner">{error}</p>}
        {notice && <p className="info-banner">{notice}</p>}
      </div>
      <div className="notes-main">
        <div className="notes-sidebar">
          <div className="search-bar">
            <input className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search notes..." />
          </div>
          <button className="btn-new-note" onClick={() => setCreating(true)}>New Note</button>
          <div className="notes-list">
            {filteredNotes.map((note) => (
              <div key={note._id} className={`note-item ${selectedNote?._id === note._id ? 'active' : ''}`} onClick={() => setSelectedNote(note)}>
                <div className="note-title-preview">
                  <h4>{note.title}</h4>
                  <p className="category-badge">{note.category}</p>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && <p className="empty-state">No notes found. Create one!</p>}
          </div>
        </div>
        <div className="notes-editor">
          {creating ? (
            <div className="create-note-form">
              <h2>Create Note</h2>
              <input className="form-input" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" />
              <input className="form-input" value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} placeholder="Category" />
              <textarea className="form-textarea" rows={10} value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} />
              <div className="form-actions">
                <button className="btn-save" onClick={handleCreateNote}>Save</button>
                <button className="btn-cancel" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          ) : selectedNote ? (
            <div className="note-view">
            <div className="note-header">
              <h2>{selectedNote.title}</h2>
              <button className="btn-icon delete" onClick={() => handleDeleteNote(selectedNote._id)}>Delete</button>
            </div>
            <div className="note-metadata">
              <span className="category">{selectedNote.category}</span>
              <span className="date">{new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
              <span className="words">{selectedNote.wordCount} words</span>
            </div>
            <div className="note-content">{selectedNote.content || 'No content yet.'}</div>
              <div className="note-actions">
                <button className="btn-save" onClick={() => handleSummarize(selectedNote)}>Summarize</button>
                <button className="btn-save" onClick={() => handleFlashcards(selectedNote)}>Flashcards</button>
              </div>
              {summaries[selectedNote._id] && (
                <div className="note-summary">
                  <h4>Summary</h4>
                  <pre>{summaries[selectedNote._id]}</pre>
                </div>
              )}
              {flashcards[selectedNote._id] && (
                <div className="note-summary">
                  <h4>Flashcards</h4>
                  <pre>{flashcards[selectedNote._id]}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state"><p>Select or create a note</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
