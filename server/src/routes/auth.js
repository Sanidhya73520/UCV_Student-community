import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { validate } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { hashToken, requireAuth } from '../middleware/session.js';
import { queueEmail } from '../services/mailer.js';
import { emailTemplates } from '../emails/templates.js';
import { getCountryName } from '../../../shared/countries.js';
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  staffSetPasswordSchema
} from '../../../shared/schemas/auth.js';
import { env } from '../config/env.js';
import dotenv from 'dotenv';

const router = Router();

// Constant dummy hash to perform real bcrypt comparison for non-existent users (prevents timing attacks)
const DUMMY_HASH = '$2a$12$e8p4l8ZfVbN7g8xQ2j9Esu1Y9f1b2c3d4e5f6g7h8i9j0k1l2m3n4';

// Helper to set session cookie
function setSessionCookie(res, token, maxAgeMs) {
  // res.cookie('ucv_sid', token, {
  //   httpOnly: true,
  //   sameSite: 'lax',
  //   secure: env.NODE_ENV === 'production',
  //   maxAge: maxAgeMs,
  //   path: '/'
  // });
  res.cookie('ucv_sid', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
});
}

// 1. Sign Up (Students only)
router.post(
  '/signup',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 120, // 120 per hour per IP (venue Wi-Fi)
    keyGenerator: (req) => req.ip
  }),
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5, // 5 per hour per email
    keyGenerator: (req) => (typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : null)
  }),
  validate({ body: signUpSchema }),
  async (req, res, next) => {
    try {
      const { fullName, email, password, mobile, country, faculty, programme, consent } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        // If account exists with password -> send accountExists email quietly
        if (existingUser.passwordHash) {
          const isPending = existingUser.status === 'waiting';
          const emailContent = emailTemplates.accountExists({ isPending });
          await queueEmail({
            recipient: normalizedEmail,
            type: 'account_exists',
            ...emailContent,
            priority: 1
          });
        } else {
          // Imported or added by staff without password -> send activateAccount email
          const rawToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = hashToken(rawToken);
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          await PasswordResetToken.create({
            tokenHash,
            userId: existingUser._id,
            type: 'activate',
            expiresAt
          });

          const emailContent = emailTemplates.activateAccount({
            firstName: existingUser.firstName,
            resetToken: rawToken
          });
          await queueEmail({
            recipient: normalizedEmail,
            type: 'activate_account',
            ...emailContent,
            priority: 1
          });
        }

        // Anti-enumeration: Return identical success response
        return res.json({ ok: true, message: 'Request submitted' });
      }

      // Create new pending student
      const passwordHash = await bcrypt.hash(password, 12);
      const firstName = fullName.trim().split(' ')[0];

      await User.create({
        fullName: fullName.trim(),
        firstName,
        email: normalizedEmail,
        passwordHash,
        mobile: mobile.trim(),
        countryCode: country.toUpperCase().trim(),
        faculty: faculty ? faculty.trim() : '',
        programme: programme ? programme.trim() : 'erasmus_exchange',
        role: 'student',
        status: 'waiting',
        joinSource: 'signup',
        consentDate: consent ? new Date() : null,
        consentTextVersion: 'v1.0'
      });

      return res.json({ ok: true, message: 'Request submitted' });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Sign In (Students)
router.post(
  '/signin',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // 200 per 15 min per IP (venue Wi-Fi)
    keyGenerator: (req) => req.ip
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8, // 8 per 15 min per IP + email
    keyGenerator: (req) => `${req.ip}:${typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : ''}`
  }),
  validate({ body: signInSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        await bcrypt.compare(password, DUMMY_HASH);
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is not correct. Please try again.'
          }
        });
      }

      // If user is a student
      if (user.role === 'student') {
        const passwordMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!passwordMatch) {
          return res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Email or password is not correct. Please try again.'
            }
          });
        }

        // Check student approval status
        if (user.status === 'waiting') {
          return res.status(403).json({
            error: {
              code: 'PENDING_APPROVAL',
              message:
                'Your account is waiting for approval from the International Relations Department. We’ll email you as soon as you can sign in.'
            }
          });
        }

        if (user.status === 'rejected') {
          return res.status(403).json({
            error: {
              code: 'REQUEST_REJECTED',
              message:
                'The International Relations Department couldn’t approve this account. If you think this is a mistake, contact the department at international@ucv.ro.'
            }
          });
        }

        // Create 14-day student session
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const slidingMs = 14 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + slidingMs);

        await Session.create({
          tokenHash,
          userId: user._id,
          expiresAt
        });

        setSessionCookie(res, rawToken, slidingMs);

        return res.json({
          user: {
            id: user._id.toString(),
            role: user.role,
            status: user.status,
            firstName: user.firstName,
            fullName: user.fullName,
            email: user.email,
            countryCode: user.countryCode,
            countryName: getCountryName(user.countryCode)
          }
        });
      }

      // If user is staff or admin signing in on /signin
      if (user.role === 'staff' || user.role === 'admin') {
        if (user.status === 'removed') {
          return res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Email or password is not correct. Please try again.'
            }
          });
        }

        let passwordValid = false;

        if (user.isPermanentAdmin || user.email === process.env.ADMIN_EMAIL) {
          passwordValid = (password === process.env.ADMIN_PASSWORD);
        } else {
          if (user.temporaryPasswordHash) {
            if (!user.tempPasswordExpiresAt || user.tempPasswordExpiresAt > new Date()) {
              passwordValid = await bcrypt.compare(password, user.temporaryPasswordHash);
            }
          }
          if (!passwordValid && user.passwordHash) {
            passwordValid = await bcrypt.compare(password, user.passwordHash);
          }
        }

        if (!passwordValid) {
          return res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Email or password is not correct. Please try again.'
            }
          });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const slidingMs = 12 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + slidingMs);

        await Session.create({
          tokenHash,
          userId: user._id,
          expiresAt
        });

        setSessionCookie(res, rawToken, slidingMs);

        return res.json({
          user: {
            id: user._id.toString(),
            role: user.role,
            status: user.status,
            firstName: user.firstName,
            fullName: user.fullName,
            email: user.email,
            mustChangePassword: user.mustChangePassword
          }
        });
      }

      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is not correct. Please try again.'
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// 3. Staff Login
router.post(
  '/staff-login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => req.ip
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    keyGenerator: (req) => `${req.ip}:${typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : ''}`
  }),
  validate({ body: signInSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({ email: normalizedEmail });

      if (!user || user.status === 'removed') {
        await bcrypt.compare(password, DUMMY_HASH);
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is not correct. Please try again.'
          }
        });
      }

      // If a student logs in on staff-login
      if (user.role === 'student') {
        const passwordMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!passwordMatch) {
          return res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Email or password is not correct. Please try again.'
            }
          });
        }

        if (user.status === 'waiting') {
          return res.status(403).json({
            error: {
              code: 'PENDING_APPROVAL',
              message:
                'Your account is waiting for approval from the International Relations Department. We’ll email you as soon as you can sign in.'
            }
          });
        }

        if (user.status === 'rejected') {
          return res.status(403).json({
            error: {
              code: 'REQUEST_REJECTED',
              message:
                'The International Relations Department couldn’t approve this account. If you think this is a mistake, contact the department at international@ucv.ro.'
            }
          });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const slidingMs = 14 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + slidingMs);

        await Session.create({
          tokenHash,
          userId: user._id,
          expiresAt
        });

        setSessionCookie(res, rawToken, slidingMs);

        return res.json({
          user: {
            id: user._id.toString(),
            role: user.role,
            status: user.status,
            firstName: user.firstName,
            fullName: user.fullName,
            email: user.email,
            countryCode: user.countryCode,
            countryName: getCountryName(user.countryCode)
          }
        });
      }

      // Staff or admin
      if (user.role !== 'staff' && user.role !== 'admin') {
        await bcrypt.compare(password, DUMMY_HASH);
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is not correct. Please try again.'
          }
        });
      }

      let passwordValid = false;
      let usedTempPassword = false;

      if (user.isPermanentAdmin || user.email === process.env.ADMIN_EMAIL) {
        passwordValid = (password === process.env.ADMIN_PASSWORD);
      } else {
        // Check temporary password first if present
        if (user.temporaryPasswordHash) {
          if (!user.tempPasswordExpiresAt || user.tempPasswordExpiresAt > new Date()) {
            const matchTemp = await bcrypt.compare(password, user.temporaryPasswordHash);
            if (matchTemp) {
              passwordValid = true;
              usedTempPassword = true;
            }
          }
        }

        // If temporary didn't match, check regular passwordHash
        if (!passwordValid && user.passwordHash) {
          passwordValid = await bcrypt.compare(password, user.passwordHash);
        }
      }

      if (!passwordValid) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is not correct. Please try again.'
          }
        });
      }

      // If used temporary password, enforce mustChangePassword (except permanent admin who has explicit credentials)
      if (usedTempPassword && !user.isPermanentAdmin) {
        user.temporaryPasswordHash = null;
        user.tempPasswordExpiresAt = null;
        user.mustChangePassword = true;
        await user.save();
      }

      // Create 12-hour staff session
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const slidingMs = 12 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + slidingMs);

      await Session.create({
        tokenHash,
        userId: user._id,
        expiresAt
      });

      setSessionCookie(res, rawToken, slidingMs);

      return res.json({
        user: {
          id: user._id.toString(),
          role: user.role,
          status: user.status,
          firstName: user.firstName,
          fullName: user.fullName,
          email: user.email,
          mustChangePassword: user.mustChangePassword
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// 4. Log Out
router.post('/logout', async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.ucv_sid;
    if (cookieToken) {
      const tokenHash = hashToken(cookieToken);
      await Session.deleteOne({ tokenHash });
    }
    res.clearCookie('ucv_sid', { path: '/' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 5. Current Session (Me)
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  res.json({
    user: {
      id: req.user._id.toString(),
      role: req.user.role,
      status: req.user.status,
      firstName: req.user.firstName,
      fullName: req.user.fullName,
      email: req.user.email,
      countryCode: req.user.countryCode,
      countryName: getCountryName(req.user.countryCode),
      faculty: req.user.faculty,
      programme: req.user.programme,
      mobile: req.user.mobile,
      isPermanentAdmin: req.user.isPermanentAdmin,
      mustChangePassword: req.user.mustChangePassword,
      notificationPrefs: req.user.notificationPrefs,
      consentDate: req.user.consentDate
    }
  });
});

// 6. Forgot Password
router.post(
  '/forgot-password',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30, // 30 per hour per IP
    keyGenerator: (req) => req.ip
  }),
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3, // 3 per hour per email
    keyGenerator: (req) => (typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : null)
  }),
  validate({ body: forgotPasswordSchema }),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({ email: normalizedEmail });

      if (user && (user.isPermanentAdmin || user.email === 'sanjana.singh111910@gmail.com')) {
        // Permanent admin password cannot be reset via web
        return res.json({ ok: true, message: 'Check your email' });
      }

      if (user && (user.status === 'approved' || user.status === 'active' || user.status === 'invited')) {
        // Invalidate older unused reset tokens for this user
        await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await PasswordResetToken.create({
          tokenHash,
          userId: user._id,
          type: 'reset',
          expiresAt
        });

        const emailContent = emailTemplates.passwordReset({
          firstName: user.firstName,
          resetToken: rawToken
        });

        await queueEmail({
          recipient: normalizedEmail,
          type: 'password_reset',
          ...emailContent,
          priority: 1
        });
      }

      // Always return identical message
      res.json({ ok: true, message: 'Check your email' });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Check Reset Password Token
router.get(
  '/reset-password/check',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 checks per 15 min per IP
    keyGenerator: (req) => req.ip
  }),
  async (req, res, next) => {
  try {
    const rawToken = req.query.token;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.json({ valid: false });
    }

    const tokenHash = hashToken(rawToken);
    const tokenDoc = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.json({ valid: false });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user || user.status === 'removed' || user.status === 'rejected') {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      type: tokenDoc.type,
      isStaff: user.role === 'staff' || user.role === 'admin'
    });
  } catch (err) {
    next(err);
  }
});

// 8. Reset Password (execute)
router.post(
  '/reset-password',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 reset attempts per 15 min per IP
    keyGenerator: (req) => req.ip
  }),
  validate({ body: resetPasswordSchema }),
  async (req, res, next) => {
    try {
      const { token, password, consent } = req.body;
      const tokenHash = hashToken(token);

      const tokenDoc = await PasswordResetToken.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        return res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'This link has expired or was already used.'
          }
        });
      }

      const user = await User.findById(tokenDoc.userId);
      if (!user) {
        return res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'This link has expired or was already used.'
          }
        });
      }

      if (user.isPermanentAdmin || user.email === 'sanjana.singh111910@gmail.com') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Permanent administrator password cannot be modified via public reset.'
          }
        });
      }

      // If in activate mode, consent checkbox is required
      if (tokenDoc.type === 'activate' && !consent) {
        return res.status(400).json({
          error: {
            code: 'CONSENT_REQUIRED',
            message: 'Please agree to data use to continue.'
          }
        });
      }

      // Hash new password
      user.passwordHash = await bcrypt.hash(password, 12);
      user.temporaryPasswordHash = null;
      user.tempPasswordExpiresAt = null;
      user.mustChangePassword = false;

      if (tokenDoc.type === 'activate') {
        user.consentDate = new Date();
        user.consentTextVersion = 'v1.0';
      }

      if (user.role === 'staff' && user.status === 'invited') {
        user.status = 'active';
      }

      await user.save();

      // Mark token used
      tokenDoc.usedAt = new Date();
      await tokenDoc.save();

      // Invalidate all existing sessions on all devices
      await Session.deleteMany({ userId: user._id });
      res.clearCookie('ucv_sid', { path: '/' });

      res.json({ ok: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// 9. Staff First Sign-in: Set Own Password
router.post(
  '/staff/set-password',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.ip
  }),
  requireAuth,
  validate({ body: staffSetPasswordSchema }),
  async (req, res, next) => {
    try {
      if (req.user.role !== 'staff' && req.user.role !== 'admin') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Staff access required.'
          }
        });
      }

      if (req.user.isPermanentAdmin || req.user.email === 'sanjana.singh111910@gmail.com') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Permanent administrator password cannot be changed.'
          }
        });
      }

      const { password } = req.body;
      req.user.passwordHash = await bcrypt.hash(password, 12);
      req.user.temporaryPasswordHash = null;
      req.user.tempPasswordExpiresAt = null;
      req.user.mustChangePassword = false;
      if (req.user.status === 'invited') {
        req.user.status = 'active';
      }

      await req.user.save();

      res.json({ ok: true, message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
