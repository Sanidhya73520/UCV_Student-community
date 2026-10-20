import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { csrfAndContentTypeCheck } from './middleware/csrf.js';
import { noSqlSanitizer } from './middleware/sanitize.js';
import { loadSession } from './middleware/session.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

import { connectDB } from './db/connect.js';

const app = express();


app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UCV API Server is running',
    health: '/api/health'
  });
});


app.get('/__debug', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Express app is responding'
  });
});

// Trust proxy for Vercel and reverse proxies
app.set('trust proxy', 1);

// Disable x-powered-by
app.disable('x-powered-by');

// Security headers with helmet
app.use(helmet());

// Body parser with 100kb limit
app.use(express.json({ limit: '100kb' }));

// NoSQL injection and prototype pollution sanitizer
app.use(noSqlSanitizer);

// Cookie parser for session and voter tokens
app.use(cookieParser());

// Request logging (sanitized, no sensitive query params on auth routes)
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args) {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      const sanitizedUrl = req.originalUrl.includes('/auth')
        ? req.originalUrl.split('?')[0]
        : req.originalUrl;
      console.log(`[REQ] ${req.method} ${sanitizedUrl} ${res.statusCode} ${duration}ms`);
    }
    return originalEnd.apply(this, args);
  };

  next();
});

// Configure CORS for allowed origins across all environments
const allowedOrigins = [
    'https://ucvinternationalstudent-community.vercel.app',
  'https://ucvstudent-communityserver.vercel.app',
  env.APP_URL,
  ...env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
];

if (process.env.VERCEL_ENV === 'preview') {
  if (process.env.VERCEL_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_BRANCH_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          return new URL(allowed).origin === new URL(origin).origin;
        } catch {
          return allowed === origin;
        }
      });
            // Also allow any vercel.app deployment for preview / production
      let isVercelDomain = false;
      try {
        const parsedHost = new URL(origin).hostname;
        if (parsedHost.endsWith('.vercel.app')) {
          isVercelDomain = true;
        }
      } catch {
        if (typeof origin === 'string' && origin.endsWith('.vercel.app')) {
          isVercelDomain = true;
        }
      }
      if (isAllowed || isVercelDomain) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Voter-Key']
  })
);

// CSRF Origin & Content-Type validation on non-GET
app.use(csrfAndContentTypeCheck);


app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({
      success: false,
      message: 'Database unavailable',
    });
  }
});
// Load session from ucv_sid cookie
app.use(loadSession);

// Mount API routes under /api
app.use('/api', apiRouter);

// 404 handler for unknown routes
app.use(notFoundHandler);

// Central error handler (never leaks stack traces to client)
app.use(errorHandler);

export default app;
