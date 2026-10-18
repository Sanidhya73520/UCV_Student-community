import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
}

export function errorHandler(err, req, res, _next) {
  const errorId = crypto.randomBytes(6).toString('hex');
  logger.error(`Unhandled error [${errorId}] on ${req.method} ${req.originalUrl}:`, err);

  const status = typeof err.status === 'number' ? err.status : 500;
  const code = err.code && typeof err.code === 'string' ? err.code : 'SERVER_ERROR';
  const message = status < 500 && err.message ? err.message : 'Something went wrong. Please try again.';

  res.status(status).json({
    error: {
      code,
      message,
      id: errorId
    }
  });
}
