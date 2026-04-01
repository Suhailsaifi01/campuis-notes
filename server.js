const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers
app.use(morgan('dev')); // Request logging
app.use(express.json({ limit: '1mb' })); // Protect against large payloads
app.use(cors());

// IMPORTANT:
// - This server uses MongoDB (NOT the SQLite file at `project/database.db`).
// - Your current frontend (app.js) calls Flask endpoints: /upload and /notes on port 5000.
// - To avoid port conflicts with Flask, this server defaults to port 5001.

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_notes';

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected:', MONGODB_URI);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 2000);

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 }).catch((err) => {
  console.error('MongoDB initial connection failed:', err.message);
});

// Note Schema
const NoteSchema = new mongoose.Schema({
  title: String,
  subject: String,
  filename: String,
  content: String,
  date: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', NoteSchema);

function requireMongo(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'MongoDB not connected' });
  }
  return next();
}


app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mongoReadyState: mongoose.connection.readyState
  });
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));
app.use(express.static(__dirname));

// API Routes
app.get('/api/notes', requireMongo, async (req, res, next) => {
  try {
    const notes = await Note.find().sort({ date: -1 });
    res.status(200).json(notes);
  } catch (err) { next(err); }
});

app.post('/api/notes', requireMongo, async (req, res, next) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'Title is required' });
    const newNote = new Note(req.body);
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) { next(err); }
});

app.delete('/api/notes/:id', requireMongo, async (req, res, next) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.stack}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

app.listen(PORT, () => console.log(`Mongo API server running on port ${PORT}`));




