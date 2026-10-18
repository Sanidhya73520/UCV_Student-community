import { Router } from 'express';
import crypto from 'crypto';
import { Activity } from '../models/Activity.js';
import { Rsvp } from '../models/Rsvp.js';
import { Notification } from '../models/Notification.js';
import { ImportJob } from '../models/ImportJob.js';
import { processEmailOutbox, queueEmail } from '../services/mailer.js';
import { renderTemplate } from '../emails/templates.js';
import { env } from '../config/env.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

function timingSafeCompare(a, b) {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function handleDailyCron(req, res, next) {
  try {
    // Check Authorization: Bearer ${CRON_SECRET} or x-cron-secret
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const headerSecret = req.headers['x-cron-secret'];
    const querySecret = req.query.secret;

    const provided = bearerToken || headerSecret || querySecret;
    if (!env.CRON_SECRET || !timingSafeCompare(provided, env.CRON_SECRET)) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing cron secret.' } });
    }

    // 1. Reminders for activities starting tomorrow (Europe/Bucharest)
    // Find activities scheduled between 12 and 36 hours from now
    const now = new Date();
    const tomorrowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const upcomingActivities = await Activity.find({
      status: 'published',
      date: { $gte: tomorrowStart, $lte: tomorrowEnd },
      reminderSentAt: null
    });

    let remindersSent = 0;
    for (const act of upcomingActivities) {
      // Find RSVPs with 'going'
      const rsvps = await Rsvp.find({ activityId: act._id, response: 'going' }).populate('userId');

      const notifs = [];
      for (const r of rsvps) {
        if (!r.userId) continue;

        notifs.push({
          userId: r.userId._id,
          type: 'activity_reminder',
          title: `Reminder: ${act.title} is tomorrow!`,
          message: act.startTime ? `Starts at ${act.startTime} at ${act.venue || 'campus'}.` : 'See event details.',
          link: `/activities/${act.slug}`,
          read: false
        });

        if (r.userId.email && r.userId.notificationPrefs?.newActivities !== false) {
          const emailContent = renderTemplate('activityReminder', {
            title: act.title,
            dateStr: act.date ? new Date(act.date).toLocaleDateString('en-GB') : 'Tomorrow',
            venue: act.venue || 'University of Craiova'
          });

          await queueEmail({
            recipient: r.userId.email,
            type: 'activity_reminder',
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            priority: 2
          });
        }
        remindersSent++;
      }

      if (notifs.length > 0) {
        await Notification.insertMany(notifs);
      }

      act.reminderSentAt = new Date();
      await act.save();
    }

    // 2. Retry queued or failed emails within daily limit
    const emailOutboxResult = await processEmailOutbox();

    // 3. Remove stale ImportJobs older than 24 hours
    const staleTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const jobCleanup = await ImportJob.deleteMany({ createdAt: { $lt: staleTime } });

    res.json({
      ok: true,
      remindersSent,
      activitiesProcessed: upcomingActivities.length,
      emailsOutbox: emailOutboxResult,
      staleJobsRemoved: jobCleanup.deletedCount
    });
  } catch (err) {
    next(err);
  }
}

const cronLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.ip
});

router.get('/daily', cronLimiter, handleDailyCron);
router.post('/daily', cronLimiter, handleDailyCron);

export default router;
