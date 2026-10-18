import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { EmailQueue } from '../models/EmailQueue.js';
import { SiteSettings } from '../models/SiteSettings.js';

let transporter = null;
let isWorkerRunning = false;
let activeWorkers = 0;
const MAX_CONCURRENCY = 2; // Controlled concurrency for Brevo SMTP pool
const WORKER_INTERVAL_MS = 3000; // Watchdog interval
let workerIntervalTimer = null;
let workerSignal = null;

export function getTransporter() {
  if (transporter) return transporter;

  if (env.MAIL_TRANSPORT === 'console') {
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('==================================================');
        console.log('[CONSOLE EMAIL SENDER]');
        console.log(`To:      ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`From:    ${mailOptions.from}`);
        console.log(`ReplyTo: ${mailOptions.replyTo}`);
        console.log('--- Plain Text ---');
        console.log(mailOptions.text);
        console.log('==================================================');
        return { messageId: `mock-${Date.now()}` };
      }
    };
    return transporter;
  }

  // Production Brevo SMTP with connection pool & rate control
  transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateLimit: 5, // Max 5 messages / sec to prevent provider burst limits
    host: env.BREVO_SMTP_HOST,
    port: env.BREVO_SMTP_PORT,
    secure: false, // port 587 uses STARTTLS
    auth: {
      user: env.BREVO_SMTP_USER,
      pass: env.BREVO_SMTP_KEY
    },
    tls: {
      rejectUnauthorized: true
    }
  });

  return transporter;
}

export async function getEmailsSentTodayCount() {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const count = await EmailQueue.countDocuments({
    status: 'sent',
    sentAt: { $gte: startOfDay }
  });

  return count;
}

/**
 * Queue an email in the outbox.
 * Priority: 1 = transactional/account (always sends), 5 = announcements.
 * Idempotency: prevents duplicate sends for the same action.
 */
export async function queueEmail({
  recipient,
  type,
  subject,
  html,
  text,
  priority = 1,
  idempotencyKey = null,
  immediate = true
}) {
  const normalizedRecipient = recipient.toLowerCase().trim();

  // 1. Idempotency Check: prevent duplicate jobs for the same event
  if (idempotencyKey) {
    const existing = await EmailQueue.findOne({
      idempotencyKey,
      status: { $in: ['queued', 'processing', 'sent'] }
    });
    if (existing) {
      console.log(`[MAILER] Skipped duplicate email (${idempotencyKey}) to ${normalizedRecipient}`);
      if (immediate && existing.status === 'queued') {
        triggerEmailWorker();
      }
      return existing;
    }
  }

  // 2. Extra Safety: Prevent duplicate approval emails to the same recipient in 24h
  if (type === 'approval') {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingApproval = await EmailQueue.findOne({
      recipient: normalizedRecipient,
      type: 'approval',
      status: { $in: ['sent', 'processing', 'queued'] },
      createdAt: { $gte: twentyFourHoursAgo }
    });
    if (existingApproval) {
      console.log(`[MAILER] Approval email already active for ${normalizedRecipient}`);
      return existingApproval;
    }
  }

  // 3. Create persistent queued record
  const emailItem = new EmailQueue({
    recipient: normalizedRecipient,
    type,
    subject,
    html,
    text,
    priority,
    idempotencyKey,
    status: 'queued'
  });

  await emailItem.save();

  // Wake worker immediately for rapid non-blocking delivery
  triggerEmailWorker();

  return emailItem;
}

/**
 * Process a single email job with lock, retry, backoff, and privacy data wiping.
 */
export async function processQueueItem(emailItem) {
  try {
    const sentToday = await getEmailsSentTodayCount();

    // Check Brevo daily limit (280/day safety buffer)
    if (sentToday >= env.EMAIL_DAILY_LIMIT) {
      console.warn(`[MAILER] Daily email limit reached (${sentToday}/${env.EMAIL_DAILY_LIMIT}). Postponing ${emailItem._id}.`);
      emailItem.status = 'queued';
      emailItem.lockedAt = null;
      emailItem.nextAttemptAt = new Date(Date.now() + 15 * 60 * 1000); // Check again in 15 mins
      await emailItem.save();
      return emailItem;
    }

    // Check notification share limit for priority > 1 announcements
    if (emailItem.priority > 1 && sentToday >= env.EMAIL_NOTIFICATION_SHARE) {
      console.log(`[MAILER] Notification daily share reached (${sentToday}/${env.EMAIL_NOTIFICATION_SHARE}). Deferring ${emailItem._id}.`);
      emailItem.status = 'queued';
      emailItem.lockedAt = null;
      emailItem.nextAttemptAt = new Date(Date.now() + 30 * 60 * 1000);
      await emailItem.save();
      return emailItem;
    }

    // Get reply-to from SiteSettings or fallback to MAIL_FROM_EMAIL
    let replyTo = env.MAIL_FROM_EMAIL;
    try {
      const settings = await SiteSettings.findOne({});
      if (settings?.officeEmail) {
        replyTo = settings.officeEmail;
      }
    } catch {
      // Fallback to default
    }

    const transport = getTransporter();
    await transport.sendMail({
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL}>`,
      sender: env.MAIL_FROM_EMAIL,
      to: emailItem.recipient,
      replyTo,
      subject: emailItem.subject,
      html: emailItem.html,
      text: emailItem.text,
      envelope: {
        from: env.MAIL_FROM_EMAIL,
        to: emailItem.recipient
      }
    });

    // Mark as sent and wipe sensitive HTML and text for privacy & storage optimization
    emailItem.status = 'sent';
    emailItem.sentAt = new Date();
    emailItem.attempts += 1;
    emailItem.lastAttemptAt = new Date();
    emailItem.lockedAt = null;
    emailItem.nextAttemptAt = null;
    emailItem.error = null;
    emailItem.html = null;
    emailItem.text = null;
    await emailItem.save();

    console.log(`[MAILER] Delivered email [${emailItem.type}] to ${emailItem.recipient} (Attempts: ${emailItem.attempts})`);
    return emailItem;
  } catch (err) {
    const safeError = (err.message || 'Unknown SMTP error').replace(/(\b\w{20,}\b)/g, '***');
    console.error(`[MAILER] Failed to deliver ${emailItem._id} to ${emailItem.recipient}:`, safeError);

    emailItem.attempts += 1;
    emailItem.lastAttemptAt = new Date();
    emailItem.lockedAt = null;
    emailItem.error = safeError;

    if (emailItem.attempts >= 5) {
      emailItem.status = 'failed';
      emailItem.nextAttemptAt = null;
      console.error(`[MAILER] Email ${emailItem._id} exceeded max retry attempts (5). Marked failed.`);
    } else {
      emailItem.status = 'queued';
      // Exponential backoff: 15s, 30s, 60s, 120s...
      const backoffSeconds = Math.min(300, Math.pow(2, emailItem.attempts) * 15);
      emailItem.nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);
    }

    await emailItem.save();
    return emailItem;
  }
}

/**
 * Recovers stranded jobs that were locked when a server abruptly crashed or restarted.
 */
export async function recoverStaleEmailJobs() {
  try {
    const staleThreshold = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes stale lock
    const res = await EmailQueue.updateMany(
      {
        status: 'processing',
        lockedAt: { $lt: staleThreshold }
      },
      {
        $set: {
          status: 'queued',
          lockedAt: null,
          error: 'Recovered from unexpected server shutdown while processing'
        }
      }
    );
    if (res.modifiedCount > 0) {
      console.log(`[MAILER] Recovered ${res.modifiedCount} stranded email job(s) from previous restart.`);
    }
  } catch (err) {
    console.error('[MAILER] Error recovering stale jobs:', err.message);
  }
}

/**
 * Asynchronous worker loop that fetches and delivers queued emails with controlled concurrency.
 */
async function emailWorkerTick() {
  if (activeWorkers >= MAX_CONCURRENCY) return;

  try {
    const now = new Date();
    // Atomically claim the highest priority queued job whose scheduled time has arrived
    const job = await EmailQueue.findOneAndUpdate(
      {
        status: 'queued',
        $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $lte: now } }]
      },
      {
        $set: {
          status: 'processing',
          lockedAt: now
        }
      },
      {
        sort: { priority: 1, createdAt: 1 },
        new: true
      }
    );

    if (!job) return;

    activeWorkers++;
    (async () => {
      try {
        await processQueueItem(job);
      } finally {
        activeWorkers--;
        // Immediately check if more jobs are waiting in the queue
        triggerEmailWorker();
      }
    })();
  } catch (err) {
    console.error('[MAILER] Worker tick error:', err.message);
  }
}

/**
 * Wakes up the background worker immediately.
 */
export function triggerEmailWorker() {
  if (!isWorkerRunning) return;
  setImmediate(() => {
    emailWorkerTick();
  });
}

/**
 * Starts the persistent background email worker.
 */
export async function startEmailWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  console.log('[MAILER] Background email worker started with concurrency pool.');

  // 1. Recover any in-flight jobs from previous server run
  await recoverStaleEmailJobs();

  // 2. Start routine watchdog timer (every 3 seconds)
  workerIntervalTimer = setInterval(async () => {
    await emailWorkerTick();
  }, WORKER_INTERVAL_MS);

  // 3. Stale job recovery routine (every 60 seconds)
  setInterval(async () => {
    await recoverStaleEmailJobs();
  }, 60 * 1000);

  // Initial pump
  triggerEmailWorker();
}

/**
 * Gracefully stops the email worker.
 */
export async function stopEmailWorker() {
  isWorkerRunning = false;
  if (workerIntervalTimer) {
    clearInterval(workerIntervalTimer);
    workerIntervalTimer = null;
  }
  // Wait up to 3 seconds for active workers to complete
  const start = Date.now();
  while (activeWorkers > 0 && Date.now() - start < 3000) {
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log('[MAILER] Background email worker stopped.');
}

/**
 * Manual queue processing helper for backwards-compatibility with cron endpoints.
 */
export async function processEmailOutbox() {
  triggerEmailWorker();
  const queuedCount = await EmailQueue.countDocuments({ status: 'queued' });
  const processingCount = await EmailQueue.countDocuments({ status: 'processing' });
  return { queued: queuedCount, processing: processingCount };
}
