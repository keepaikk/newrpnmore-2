import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

import leadsRouter from './routes/leads.js';
import cmsRouter from './routes/cms.js';
import { requireAuth, requireAuthPage, loginHandler, logoutHandler } from './middleware/auth.js';
import { prisma } from './lib/prisma.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const pdfUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for PDFs
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only PDF and image files are allowed'));
  },
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default-secret-change-me',
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === 'true',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Auth routes
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/logout', logoutHandler);

// Image upload endpoint (protected)
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// PDF upload endpoint (protected)
app.post('/api/upload-pdf', requireAuth, pdfUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Leads API
app.use('/api/leads', leadsRouter);

// Public hero image endpoint
app.get('/api/hero-images/:page', async (req, res) => {
  try {
    const item = await prisma.heroImage.findUnique({ where: { page: req.params.page } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CMS API (protected)
app.use('/api/cms', requireAuth, cmsRouter);

// Admin dashboard static files
const adminPath = path.join(__dirname, '..', 'admin');
app.use('/admin', (req, res, next) => {
  if (req.path === '/login.html' || req.path.startsWith('/dashboard.')) {
    return next();
  }
  return requireAuthPage(req, res, next);
}, express.static(adminPath));
app.get('/admin', requireAuthPage, (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Frontend static files (Vite build output)
const distPath = path.join(__dirname, '..', '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Clean URL aliases for HTML pages
  app.get('/books', (_req, res) => {
    res.sendFile(path.join(distPath, 'books.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'RPNMore API is running. Build the frontend to serve the website.' });
  });
}

app.listen(PORT, () => {
  console.log(`RPNMore backend running on http://localhost:${PORT}`);
});
