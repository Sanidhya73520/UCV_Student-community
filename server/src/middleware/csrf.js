import { env } from '../config/env.js';

export function csrfAndContentTypeCheck(req, res, next) {
  // Safe methods: GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt internal cron endpoint if triggered with CRON_SECRET or specific routes if needed
  if (req.path === '/api/cron/daily') {
    return next();
  }

  // 1. Origin / Referer check
  const allowedOrigins = [
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

  const originHeader = req.headers['origin'];
  const refererHeader = req.headers['referer'];

  let requestOrigin = null;
  if (originHeader) {
    try {
      requestOrigin = new URL(originHeader).origin;
    } catch {
      requestOrigin = originHeader;
    }
  } else if (refererHeader) {
    try {
      requestOrigin = new URL(refererHeader).origin;
    } catch {
      requestOrigin = refererHeader;
    }
  }

  // If no Origin/Referer provided or does not match allowed origins, reject with 403
  if (!requestOrigin) {
    return res.status(403).json({
      error: {
        code: 'CSRF_ORIGIN_MISSING',
        message: 'Origin or Referer header required for state-changing requests.'
      }
    });
  }

  const isOriginAllowed = allowedOrigins.some((allowed) => {
    try {
      return new URL(allowed).origin === requestOrigin;
    } catch {
      return allowed === requestOrigin;
    }
  });

  if (!isOriginAllowed) {
    return res.status(403).json({
      error: {
        code: 'CSRF_ORIGIN_INVALID',
        message: 'Origin not allowed.'
      }
    });
  }

  // 2. Content-Type check for non-GET requests (except multipart upload for import or requests without body)
  const isMultipart = req.path.includes('/import') && req.headers['content-type']?.includes('multipart/form-data');
  const hasBody = (req.headers['content-length'] && req.headers['content-length'] !== '0') || req.headers['transfer-encoding'];
  const hasContentType = Boolean(req.headers['content-type']);

  if (!isMultipart && (hasBody || hasContentType)) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return res.status(415).json({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Content-Type must be application/json.'
        }
      });
    }
  }

  next();
}
