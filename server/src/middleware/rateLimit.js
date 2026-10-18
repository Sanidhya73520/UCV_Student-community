import mongoose from 'mongoose';
import { RateBucket } from '../models/RateBucket.js';

const inMemoryBuckets = new Map();

export function rateLimit({
  windowMs = 60 * 1000,
  max = 60,
  keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'anonymous',
  message = 'Too many attempts. Please wait a few minutes and try again.',
  skip = () => false
}) {
  return async (req, res, next) => {
    if (skip(req)) return next();

    try {
      const generatedKey = await keyGenerator(req);
      if (!generatedKey) return next();

      const key = `rl:${generatedKey}`;
      const now = Date.now();
      const expireAt = new Date(now + windowMs);

      let count = 1;

      // If MongoDB connected, use RateBucket with TTL
      if (mongoose.connection.readyState === 1) {
        const bucket = await RateBucket.findOneAndUpdate(
          { key },
          {
            $inc: { count: 1 },
            $setOnInsert: { expireAt }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        count = bucket?.count || 1;
      } else {
        // Fallback in-memory map (e.g. during standalone tests or before DB connects)
        const entry = inMemoryBuckets.get(key);
        if (entry && entry.expireAt > now) {
          entry.count += 1;
          count = entry.count;
        } else {
          inMemoryBuckets.set(key, { count: 1, expireAt: now + windowMs });
          count = 1;
        }
      }

      if (count > max) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        return res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message
          }
        });
      }

      next();
    } catch (err) {
      console.error('Rate limiting error:', err.message);
      next();
    }
  };
}
