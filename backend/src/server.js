import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

import leadsRouter from './routes/leads.js';
import cmsRouter from './routes/cms.js';
import { requireAuth, requireAuthPage, loginHandler, logoutHandler } from './middleware/auth.js';
import { prisma } from './lib/prisma.js';
import { router as telegramRouter, registerWebhook } from './routes/telegram.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

/* ─── Security Headers (Helmet) ─── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for Google Fonts
}));

/* ─── CORS — restrict to production domain ─── */
const allowedOrigins = IS_PROD
  ? [process.env.APP_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* ─── Rate Limiting ─── */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const leadsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

app.use(generalLimiter);

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

/* ─── Session Hardening ─── */
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.error('[FATAL] SESSION_SECRET environment variable is required');
  process.exit(1);
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'rpnmore.sid',
    cookie: {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Auth routes — strict rate limit on login
app.post('/api/auth/login', strictLimiter, loginHandler);
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

// Leads API — rate limited to prevent spam
app.use('/api/leads', leadsLimiter, leadsRouter);

// Telegram bot webhook
app.use('/api/telegram', telegramRouter);

// Public hero image endpoint
app.get('/api/hero-images/:page', async (req, res) => {
  try {
    const item = await prisma.heroImage.findUnique({ where: { page: req.params.page } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('[HeroImages] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint (used by Dokploy / Docker / load balancers)
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Health] DB check failed:', err.message);
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// CMS API — GET is public (frontend reads), POST/PUT/DELETE require admin auth
app.use('/api/cms', (req, res, next) => {
  if (req.method === 'GET') return next();
  return requireAuth(req, res, next);
}, cmsRouter);

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
  const pageRoutes = [
    'cars',
    'real-estate',
    'digital-services',
    'blog',
    'about',
    'contact',
    'books',
    'our-works',
    'signup-ghana',
    'wealth-assets',
  ];
  for (const page of pageRoutes) {
    app.get(`/${page}`, (_req, res) => {
      res.sendFile(path.join(distPath, `${page}.html`));
    });
  }

  // SPA fallback for everything else (e.g., direct URL visits, refreshes)
  app.get('*', (req, res) => {
    // Don't fallback for API or admin routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin/') || req.path.startsWith('/uploads/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'RPNMore API is running. Build the frontend to serve the website.' });
  });
}

/* ─── Global Error Handler — never leak stack traces or DB errors ─── */
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`RPNMore backend running on http://0.0.0.0:${PORT}`);
  await registerWebhook();
});
