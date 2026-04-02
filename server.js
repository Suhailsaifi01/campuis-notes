const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const fs = require('fs');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cors());

const PORT = process.env.PORT || 5001;
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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));
app.use(express.static(__dirname));

// Multer setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDFs allowed'), false);
  } 
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mongoReadyState: mongoose.connection.readyState
  });
});

// Flask-compatible endpoints
app.post('/upload', upload.single('file'), requireMongo, async (req, res, next) => {
  try {
    const { title, subject } = req.body;
    if (!title || !subject || !req.file) return res.status(400).json({ error: 'Missing title/subject/file' });

    const noteData = {
      title, 
      subject, 
      filename: req.file.filename,
      content: req.file.originalname
    };
    const note = new Note(noteData);
    await note.save();

    res.json({
      id: note._id,
      filename: req.file.filename,
      message: 'Upload successful'
    });
  } catch (err) {
    next(err);
  }
});

app.get('/notes', requireMongo, async (req, res, next) => {
  try {
    const notes = await Note.find().sort({ date: -1 });
    res.json(notes);
  } catch (err) { next(err); }
});

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

