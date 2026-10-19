import crypto from 'crypto';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function loadSession(req, res, next) {
  req.session = null;
  req.user = null;

  let cookieToken = null;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    cookieToken = authHeader.slice(7).trim();
  }
  if (!cookieToken) {
        cookieToken = req.cookies?.ucv_sid;
  }
  if (!cookieToken) {
    return next();
  }

  try {
    const tokenHash = hashToken(cookieToken);
    const session = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } });

    if (!session) {
      res.clearCookie('ucv_sid');
      return next();
    }

    const user = await User.findById(session.userId);
    if (!user || user.status === 'removed' || user.status === 'rejected') {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie('ucv_sid');
      return next();
    }

    // Sliding session renewal
    const isStudent = user.role === 'student';
    const slidingMs = isStudent ? 14 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    session.expiresAt = new Date(Date.now() + slidingMs);
    await session.save();

    req.session = session;
    req.user = user;
    next();
  } catch (err) {
    console.error('Session load error:', err.message);
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Please sign in to continue.'
      }
    });
  }
  next();
}

export function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Please sign in to continue.'
      }
    });
  }

  if (req.user.role !== 'student' || req.user.status !== 'approved') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN_STUDENT_ONLY',
        message: 'Approved student access required.'
      }
    });
  }

  next();
}

export function requireStaff(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Staff login required.'
      }
    });
  }

  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN_STAFF_ONLY',
        message: 'Staff access required.'
      }
    });
  }

  if (req.user.mustChangePassword) {
    return res.status(403).json({
      error: {
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must choose your own password before continuing.'
      }
    });
  }

  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Admin login required.'
      }
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN_ADMIN_ONLY',
        message: 'Only admins can perform this action.'
      }
    });
  }

  if (req.user.mustChangePassword) {
    return res.status(403).json({
      error: {
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must choose your own password before continuing.'
      }
    });
  }

  next();
}
