import { Router } from 'express';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { Rsvp } from '../models/Rsvp.js';
import { Question } from '../models/Question.js';
import { MonthlyQuestion } from '../models/MonthlyQuestion.js';
import { WallPost } from '../models/WallPost.js';
import { MeToo } from '../models/MeToo.js';
import { WordOfTheMonth } from '../models/WordOfTheMonth.js';
import { notifyWallUpdated } from '../services/wallBroadcaster.js';
import { Phrase } from '../models/Phrase.js';
import { SharedWord } from '../models/SharedWord.js';
import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { ClubArea } from '../models/ClubArea.js';
import { ClubUpvote } from '../models/ClubUpvote.js';
import { ClubProposal } from '../models/ClubProposal.js';
import { AmbassadorApplication } from '../models/AmbassadorApplication.js';
import { Notification } from '../models/Notification.js';
import { EmailQueue } from '../models/EmailQueue.js';
import { AuditLog } from '../models/AuditLog.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { ImportJob } from '../models/ImportJob.js';
import { Session } from '../models/Session.js';
import { getCountryName, resolveCountryCode } from '../../../shared/countries.js';
import { getSemestersList, getSemesterForDate, getCurrentSemester } from '../../../shared/semesters.js';
import { requireAuth, requireStaff, requireAdmin } from '../middleware/session.js';
import { validate } from '../middleware/validate.js';
import {
  activitySchema,
  answerQuestionSchema,
  wordOfTheMonthSchema,
  phraseSchema,
  questionOfTheMonthSchema,
  siteSettingsSchema,
  openClubSchema,
  proposalStatusSchema,
  logHoursSchema,
  addStudentSchema
} from '../../../shared/schemas/staff.js';
import { queueEmail } from '../services/mailer.js';
import { renderTemplate, emailTemplates, getAppUrl } from '../emails/templates.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { hashToken } from '../middleware/session.js';
import { env } from '../config/env.js';
import { getMapPayload, notifyMapUpdated, handleMapStream } from '../services/mapBroadcaster.js';
import { notifyActivityUpdated, handleActivitiesStream } from '../services/activityBroadcaster.js';

const router = Router();

// Protect all staff routes
router.use(requireAuth, requireStaff);

// Helper for slug generation
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// Formula injection protection for Excel/CSV exports (SECURITY.md §7)
function sanitizeCell(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/^[=+\-@\t\r]/.test(s)) {
    return `'${s}`;
  }
  return s;
}

function getSemesterRange(semesterId) {
  if (semesterId === 'autumn-2026') {
    return {
      id: 'autumn-2026',
      name: 'Autumn semester 2026',
      start: new Date(Date.UTC(2026, 8, 1, 0, 0, 0)),
      end: new Date(Date.UTC(2027, 0, 31, 23, 59, 59, 999))
    };
  }
  if (semesterId === 'spring-2027') {
    return {
      id: 'spring-2027',
      name: 'Spring semester 2027',
      start: new Date(Date.UTC(2027, 1, 1, 0, 0, 0)),
      end: new Date(Date.UTC(2027, 7, 31, 23, 59, 59, 999))
    };
  }
  return getCurrentSemester();
}

// 1. Overview Dashboard (Screen 34)
router.get('/overview', async (req, res, next) => {
  try {
    const now = new Date();
    const [
      pendingApprovalsCount,
      approvedStudentsCount,
      rejectedStudentsCount,
      unansweredQuestionsCount,
      countryAgg,
      nextEvent,
      auditLogs,
      pendingStudents,
      recentDecisions,
      unansweredQuestions,
      recentWallPosts,
      recentSharedWords,
      topClubAreas,
      newProposalsCount
    ] = await Promise.all([
      User.countDocuments({ role: 'student', status: { $in: ['waiting', 'pending'] } }),
      User.countDocuments({ role: 'student', status: 'approved' }),
      User.countDocuments({ role: 'student', status: 'rejected' }),
      Question.countDocuments({ status: { $in: ['waiting', 'pending'] } }),
      User.aggregate([
        { $match: { role: 'student', status: 'approved' } },
        { $group: { _id: '$countryCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Activity.findOne({
        status: 'published',
        $or: [{ date: { $gte: now } }, { dateToConfirm: true }]
      })
        .sort({ date: 1, createdAt: 1 })
        .lean(),
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'fullName')
        .lean(),
      User.find({ role: 'student', status: { $in: ['waiting', 'pending'] } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      User.find({ role: 'student', status: { $in: ['approved', 'rejected'] } })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(15)
        .lean(),
      Question.find({ status: { $in: ['waiting', 'pending'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'fullName firstName countryCode')
        .lean(),
      WallPost.find({ state: 'visible' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'fullName countryCode')
        .lean(),
      SharedWord.find({ state: 'visible' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'fullName countryCode')
        .lean(),
      ClubArea.find({})
        .sort({ upvoteCount: -1 })
        .limit(4)
        .lean(),
      ClubProposal.countDocuments({ status: { $in: ['received', 'pending'] } })
    ]);

    const totalStudents = countryAgg.reduce((acc, curr) => acc + curr.count, 0);

    const latestModeration = [
      ...recentWallPosts.map((p) => ({
        id: p._id.toString(),
        type: 'wall',
        snippet: p.text,
        authorName: p.userId ? p.userId.fullName : 'Student',
        authorCountry: p.userId ? p.userId.countryCode : '',
        createdAt: p.createdAt
      })),
      ...recentSharedWords.map((w) => ({
        id: w._id.toString(),
        type: 'word',
        snippet: `${w.word}${w.meaning ? ` — ${w.meaning}` : ''}`,
        authorName: w.userId ? w.userId.fullName : 'Student',
        authorCountry: w.userId ? w.userId.countryCode : '',
        createdAt: w.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    let nextEventObj = null;
    if (nextEvent) {
      const [goingCount, notGoingCount] = await Promise.all([
        Rsvp.countDocuments({ activityId: nextEvent._id, response: 'going' }),
        Rsvp.countDocuments({ activityId: nextEvent._id, response: 'not_going' })
      ]);
      nextEventObj = {
        id: nextEvent._id.toString(),
        title: nextEvent.title,
        date: nextEvent.date,
        startTime: nextEvent.startTime,
        venue: nextEvent.venue,
        goingCount,
        notGoingCount,
        itineraryCount: nextEvent.itinerary?.length || 0
      };
    }

    res.json({
      pendingApprovalsCount,
      approvedStudentsCount,
      rejectedStudentsCount,
      unansweredQuestionsCount,
      totalStudents,
      totalCountries: countryAgg.length,
      nextEvent: nextEventObj,
      byCountry: countryAgg.map((c) => ({
        countryCode: c._id,
        countryName: getCountryName(c._id),
        count: c.count
      })),
      pendingApprovals: pendingStudents.map((s) => ({
        id: s._id.toString(),
        fullName: s.fullName,
        email: s.email,
        mobile: s.mobile || '',
        countryCode: s.countryCode,
        countryName: getCountryName(s.countryCode),
        programme: s.programme || 'other',
        faculty: s.faculty || '',
        status: s.status,
        createdAt: s.createdAt
      })),
      recentDecisions: recentDecisions.map((s) => ({
        id: s._id.toString(),
        fullName: s.fullName,
        email: s.email,
        countryCode: s.countryCode,
        countryName: getCountryName(s.countryCode),
        status: s.status,
        updatedAt: s.updatedAt || s.createdAt
      })),
      unansweredQuestions: unansweredQuestions.map((q) => {
        const resolvedName =
          q.studentName ||
          q.userId?.fullName ||
          (q.userId?.firstName ? `${q.userId.firstName}` : '') ||
          'International Student';
        return {
          id: q._id.toString(),
          text: q.text,
          category: q.topic || 'general',
          topic: q.topic || 'general',
          studentName: resolvedName,
          authorName: resolvedName,
          countryCode: q.userId?.countryCode || '',
          createdAt: q.createdAt
        };
      }),
      latestModeration,
      topClubAreas: topClubAreas.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        title: a.name,
        upvoteCount: a.upvoteCount || 0
      })),
      newProposalsCount,
      auditLogs: auditLogs.map((l) => ({
        id: l._id.toString(),
        action: l.action,
        actor: l.userId ? l.userId.fullName : 'System',
        targetType: l.targetType,
        targetId: l.targetId,
        meta: l.meta,
        createdAt: l.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 2. Navigation Badges Count
router.get('/badges', async (req, res, next) => {
  try {
    const [pendingApprovals, unansweredQuestions, openProposals] = await Promise.all([
      User.countDocuments({ role: 'student', status: 'waiting' }),
      Question.countDocuments({ status: 'waiting' }),
      ClubProposal.countDocuments({ status: { $in: ['received', 'pending'] } })
    ]);

    res.json({
      pendingApprovals,
      unansweredQuestions,
      openProposals
    });
  } catch (err) {
    next(err);
  }
});

// 3. Live Map (Screens 35 & 36) - Real-time and SSE Stream
router.get('/live-map', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const data = await getMapPayload();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/live-map/stream', (req, res) => {
  handleMapStream(req, res);
});

// 4. Student Approvals (Screens 37 & 38)
router.get('/approvals', async (req, res, next) => {
  try {
    const { status = 'pending', q = '' } = req.query;
    const filter = { role: 'student' };

    if (status === 'pending' || status === 'waiting') {
      filter.status = { $in: ['waiting', 'pending'] };
    } else if (status === 'approved') {
      filter.status = 'approved';
    } else if (status === 'rejected') {
      filter.status = 'rejected';
    }
    // If status is 'all', filter.status is omitted to match all students

    if (q && q.trim()) {
      const term = q.trim();
      filter.$or = [
        { fullName: new RegExp(term, 'i') },
        { email: new RegExp(term, 'i') },
        { countryCode: new RegExp(term, 'i') }
      ];
    }

    const [students, pendingCount, approvedCount, rejectedCount, allCount] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments({ role: 'student', status: { $in: ['waiting', 'pending'] } }),
      User.countDocuments({ role: 'student', status: 'approved' }),
      User.countDocuments({ role: 'student', status: 'rejected' }),
      User.countDocuments({ role: 'student' })
    ]);

    res.json({
      pendingCount,
      approvedCount,
      rejectedCount,
      allCount,
      students: students.map((s) => ({
        id: s._id.toString(),
        fullName: s.fullName,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        mobile: s.mobile || '',
        countryCode: s.countryCode,
        countryName: getCountryName(s.countryCode),
        programme: s.programme || 'other',
        faculty: s.faculty || '',
        status: s.status,
        joinSource: s.joinSource,
        createdAt: s.createdAt,
        approvedAt: s.approvedAt,
        rejectedAt: s.rejectedAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/approvals/:id/approve', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }

    student.status = 'approved';
    student.approvedAt = new Date();
    student.approvedBy = req.user._id;
    student.rejectedAt = null;
    student.rejectedBy = null;
    await student.save();

    // Queue approval email
    if (student.email) {
      const emailContent = renderTemplate('approval', {
        firstName: student.firstName || student.fullName?.split(' ')[0],
        fullName: student.fullName,
        loginUrl: `${getAppUrl()}/signin`
      });

      await queueEmail({
        recipient: student.email,
        type: 'approval',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: 1,
        idempotencyKey: `approval_${student._id}`
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'student_approved',
      targetType: 'User',
      targetId: student._id.toString(),
      meta: { studentName: student.fullName, email: student.email }
    });

    notifyMapUpdated();

    res.json({ ok: true, status: 'approved' });
  } catch (err) {
    next(err);
  }
});

router.post('/approvals/:id/undo', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }

    const previousStatus = student.status;

    // Revert status to waiting/pending
    student.status = 'waiting';
    student.approvedAt = null;
    student.approvedBy = null;
    student.rejectedAt = null;
    student.rejectedBy = null;
    await student.save();

    // Cancel queued approval email if not yet sent
    if (student.email) {
      await EmailQueue.deleteMany({
        recipient: student.email.toLowerCase(),
        type: 'approval',
        status: 'queued'
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: previousStatus === 'rejected' ? 'student_rejection_undone' : 'student_approval_undone',
      targetType: 'User',
      targetId: student._id.toString(),
      meta: { studentName: student.fullName, email: student.email, previousStatus }
    });

    notifyMapUpdated();

    res.json({ ok: true, undone: true, status: 'waiting' });
  } catch (err) {
    next(err);
  }
});

router.post('/approvals/:id/reject', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }

    const wasApproved = student.status === 'approved';

    student.status = 'rejected';
    student.rejectedAt = new Date();
    student.rejectedBy = req.user._id;
    student.approvedAt = null;
    student.approvedBy = null;
    await student.save();

    // Cancel any queued approval email
    if (student.email) {
      await EmailQueue.deleteMany({
        recipient: student.email.toLowerCase(),
        type: 'approval',
        status: 'queued'
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'student_rejected',
      targetType: 'User',
      targetId: student._id.toString(),
      meta: { studentName: student.fullName, email: student.email, reason: req.body?.reason || 'Eligibility criteria not met' }
    });

    if (wasApproved) {
      notifyMapUpdated();
    }

    res.json({ ok: true, status: 'rejected' });
  } catch (err) {
    next(err);
  }
});

// 5. Questions Management (Screen 39)
router.get('/questions', async (req, res, next) => {
  try {
    const { filter = 'all' } = req.query;
    const query = {};
    if (filter === 'waiting') query.status = 'waiting';
    if (filter === 'answered') query.status = 'answered';

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName firstName countryCode email')
      .populate('answeredBy', 'fullName')
      .lean();

    res.json({
      questions: questions.map((q) => {
        const studentName =
          q.studentName ||
          q.userId?.fullName ||
          (q.userId?.firstName ? `${q.userId.firstName}` : '') ||
          'International Student';
        return {
          id: q._id.toString(),
          topic: q.topic,
          text: q.text,
          status: q.status,
          studentName,
          answer: q.answer || '',
          answeredBy: q.answeredBy?.fullName || '',
          answeredAt: q.answeredAt,
          createdAt: q.createdAt,
          student: q.userId
            ? {
                id: q.userId._id.toString(),
                fullName: q.userId.fullName || studentName,
                firstName: q.userId.firstName,
                email: q.userId.email,
                countryName: getCountryName(q.userId.countryCode)
              }
            : {
                fullName: studentName
              }
        };
      })
    });
  } catch (err) {
    next(err);
  }
});

router.post('/questions/:id/answer', validate(answerQuestionSchema), async (req, res, next) => {
  try {
    const { answer } = req.body;
    const question = await Question.findById(req.params.id).populate('userId');
    if (!question) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Question not found.' } });
    }

    question.answer = answer;
    question.answerText = answer;
    question.status = 'answered';
    question.answeredBy = req.user._id;
    question.answeredAt = new Date();
    await question.save();

    // Create in-app notification for the student
    if (question.userId) {
      await Notification.create({
        userId: question.userId._id,
        type: 'question_answered',
        title: 'Your question was answered',
        message: question.text.slice(0, 80),
        link: '/student/questions',
        read: false
      });

      // Send email if user has notifications turned on
      if (question.userId.email && question.userId.notificationPrefs?.questionAnswers) {
        try {
          const emailContent = renderTemplate('questionAnswered', {
            firstName: question.userId.firstName,
            questionText: question.text,
            question: question.text,
            answer: answer,
            questionsUrl: `${getAppUrl()}/student/questions`
          });

          await queueEmail({
            recipient: question.userId.email,
            type: 'question_answered',
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            priority: 2
          });
        } catch (mailErr) {
          console.error('[STAFF] Non-fatal mail error on question answer:', mailErr.message);
        }
      }
    }

    res.json({ ok: true, answer: question.answer || question.answerText, status: question.status });
  } catch (err) {
    next(err);
  }
});

router.put('/questions/:id/answer', validate(answerQuestionSchema), async (req, res, next) => {
  try {
    const { answer } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Question not found.' } });
    }

    question.answer = answer;
    question.answerText = answer;
    question.answeredBy = req.user._id;
    question.answeredAt = new Date();
    question.answerEditedAt = new Date();
    await question.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'answer_edited',
      targetType: 'Question',
      targetId: question._id.toString(),
      meta: { questionText: question.text }
    });

    res.json({ ok: true, answer: question.answer });
  } catch (err) {
    next(err);
  }
});

// 6. Students Directory (Screen 40)
router.get('/students', async (req, res, next) => {
  try {
    const { search = '', status = 'all', country = '', page = 1, limit = 50 } = req.query;
    const query = { role: 'student' };

    if (status !== 'all') {
      query.status = status;
    }

    if (country) {
      query.countryCode = country.toUpperCase();
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: regex }, { email: regex }, { faculty: regex }];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [students, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      User.countDocuments(query)
    ]);

    const studentIds = students.map((s) => s._id);
    const memberships = studentIds.length > 0
      ? await ClubMembership.find({ userId: { $in: studentIds } })
          .populate({
            path: 'clubId',
            match: { status: 'published' },
            select: 'name status'
          })
          .lean()
      : [];

    const clubsByUserId = new Map();
    for (const m of memberships) {
      if (m.clubId && m.clubId.name) {
        const uId = m.userId.toString();
        if (!clubsByUserId.has(uId)) {
          clubsByUserId.set(uId, []);
        }
        clubsByUserId.get(uId).push({
          id: m.clubId._id.toString(),
          name: m.clubId.name
        });
      }
    }

    res.json({
      students: students.map((s) => ({
        id: s._id.toString(),
        fullName: s.fullName,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email || '',
        mobile: s.mobile || '',
        countryCode: s.countryCode,
        countryName: getCountryName(s.countryCode),
        programme: s.programme,
        faculty: s.faculty,
        status: s.status,
        joinSource: s.joinSource,
        createdAt: s.createdAt,
        approvedAt: s.approvedAt,
        clubs: clubsByUserId.get(s._id.toString()) || []
      })),
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/students', validate(addStudentSchema), async (req, res, next) => {
  try {
    const { fullName, email, mobile, country, faculty, programme, sendInvite } = req.body;

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || parts[0];

    // Check duplicate email if email provided
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: { code: 'EMAIL_EXISTS', message: 'A student with this email already exists.' } });
      }
    }

    const student = await User.create({
      fullName,
      firstName,
      lastName,
      email: email ? email.toLowerCase() : null,
      mobile: mobile || '',
      countryCode: country.toUpperCase(),
      faculty: faculty || '',
      programme: programme || 'other',
      role: 'student',
      status: 'approved', // Directly approved by staff
      approvedAt: new Date(),
      approvedBy: req.user._id,
      joinSource: 'added_by_staff',
      consentDate: new Date()
    });

    if (student.email) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await PasswordResetToken.create({
        tokenHash,
        userId: student._id,
        type: 'activate',
        expiresAt
      });

      const emailContent = emailTemplates.activateAccount({
        firstName: student.firstName || student.fullName?.split(' ')[0],
        resetToken: rawToken
      });

      await queueEmail({
        recipient: student.email,
        type: 'activate_account',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: 1
      });
    }

    notifyMapUpdated();

    res.status(201).json({
      ok: true,
      student: {
        id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
        countryCode: student.countryCode
      }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/students/:id', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }

    const { fullName, email, mobile, countryCode, faculty, programme } = req.body;
    if (fullName) {
      student.fullName = fullName.trim();
      const parts = student.fullName.split(/\s+/);
      student.firstName = parts[0];
      student.lastName = parts.slice(1).join(' ') || parts[0];
    }
    if (email !== undefined) student.email = email ? email.trim().toLowerCase() : null;
    if (mobile !== undefined) student.mobile = mobile.trim();
    if (countryCode) student.countryCode = countryCode.trim().toUpperCase();
    if (faculty !== undefined) student.faculty = faculty.trim();
    if (programme) student.programme = programme;

    await student.save();
    res.json({ ok: true, student });
  } catch (err) {
    next(err);
  }
});

router.delete('/students/:id', requireAdmin, async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }

    if (student.isPermanentAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Permanent administrator account cannot be deleted.' } });
    }

    const { confirmEmail } = req.body;
    if (!confirmEmail || confirmEmail.toLowerCase() !== (student.email || '').toLowerCase()) {
      return res.status(400).json({ error: { code: 'CONFIRM_EMAIL_MISMATCH', message: 'Confirmation email does not match.' } });
    }

    await User.deleteOne({ _id: student._id });
    await AuditLog.create({
      userId: req.user._id,
      action: 'student_deleted',
      targetType: 'User',
      targetId: student._id.toString(),
      meta: { studentName: student.fullName, email: student.email }
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Excel Export for Students
router.get('/students/export', async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UCV International Community';
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Country Code', key: 'countryCode', width: 14 },
      { header: 'Programme', key: 'programme', width: 20 },
      { header: 'Faculty', key: 'faculty', width: 25 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Registered Date', key: 'createdAt', width: 20 }
    ];

    for (const s of students) {
      worksheet.addRow({
        fullName: s.fullName,
        email: s.email || '',
        mobile: s.mobile || '',
        country: getCountryName(s.countryCode),
        countryCode: s.countryCode,
        programme: s.programme || '',
        faculty: s.faculty || '',
        status: s.status,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ucv-students.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// 7. Activities Planner (Screens 42 & 43)
router.get('/activities', async (req, res, next) => {
  try {
    const activities = await Activity.find({})
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const rsvps = await Rsvp.find({})
      .populate('userId', 'fullName firstName countryCode faculty email')
      .lean();

    res.json({
      activities: activities.map((a) => {
        const actRsvps = rsvps.filter((r) => r.activityId.toString() === a._id.toString());
        const goingCount = actRsvps.filter((r) => r.response === 'going').length;
        const notGoingCount = actRsvps.filter((r) => r.response === 'not_going').length;
        const responses = actRsvps
          .filter((r) => r.userId)
          .map((r) => ({
            fullName: r.userId.fullName,
            firstName: r.userId.firstName,
            countryCode: r.userId.countryCode,
            countryName: getCountryName(r.userId.countryCode),
            faculty: r.userId.faculty || '',
            email: r.userId.email || '',
            answer: r.response,
            timestamp: r.timestamp || r.updatedAt || r.createdAt
          }));

        return {
          id: a._id.toString(),
          slug: a.slug,
          title: a.title,
          date: a.date,
          dateToConfirm: a.dateToConfirm,
          targetMonth: a.targetMonth,
          startTime: a.startTime,
          endTime: a.endTime,
          venue: a.venue,
          description: a.description,
          costChoice: a.costChoice,
          status: a.status,
          goingCount,
          notGoingCount,
          responses,
          itinerary: a.itinerary || [],
          checklist: a.checklist || [],
          feedbackCount: a.feedbackCount || 0
        };
      })
    });
  } catch (err) {
    next(err);
  }
});

router.get('/activities/stream', (req, res) => {
  handleActivitiesStream(req, res);
});

router.post('/activities', validate(activitySchema), async (req, res, next) => {
  try {
    const data = req.body;
    let slug = slugify(data.title);
    // Ensure slug uniqueness
    let counter = 1;
    while (await Activity.findOne({ slug })) {
      slug = `${slugify(data.title)}-${counter++}`;
    }

    const activity = await Activity.create({
      ...data,
      slug,
      goingCount: 0,
      notGoingCount: 0,
      feedbackCount: 0
    });

    res.status(201).json({
      ok: true,
      activity: {
        id: activity._id.toString(),
        slug: activity.slug,
        title: activity.title,
        status: activity.status
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/activities/:id', async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id).lean();
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

    const rsvps = await Rsvp.find({ activityId: activity._id })
      .populate('userId', 'fullName firstName countryCode faculty email')
      .lean();

    const goingCount = rsvps.filter((r) => r.response === 'going').length;
    const notGoingCount = rsvps.filter((r) => r.response === 'not_going').length;

    const responses = rsvps
      .filter((r) => r.userId)
      .map((r) => ({
        fullName: r.userId.fullName,
        firstName: r.userId.firstName,
        countryCode: r.userId.countryCode,
        countryName: getCountryName(r.userId.countryCode),
        faculty: r.userId.faculty || '',
        email: r.userId.email || '',
        answer: r.response,
        timestamp: r.timestamp || r.updatedAt || r.createdAt
      }));

    res.json({
      activity: {
        id: activity._id.toString(),
        slug: activity.slug,
        title: activity.title,
        date: activity.date,
        dateToConfirm: activity.dateToConfirm,
        targetMonth: activity.targetMonth,
        startTime: activity.startTime,
        endTime: activity.endTime,
        venue: activity.venue,
        description: activity.description,
        costChoice: activity.costChoice,
        askIfGoing: activity.askIfGoing,
        quote: activity.quote,
        quoteSource: activity.quoteSource,
        whatToBring: activity.whatToBring || [],
        goodToKnow: activity.goodToKnow || [],
        feedbackUrl: activity.feedbackUrl || '',
        itinerary: activity.itinerary || [],
        checklist: activity.checklist || [],
        status: activity.status,
        goingCount,
        notGoingCount,
        responses
      }
    });
  } catch (err) {
    next(err);
  }
});

router.put('/activities/:id', validate(activitySchema), async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

    Object.assign(activity, req.body);
    await activity.save();

    res.json({ ok: true, activity });
  } catch (err) {
    next(err);
  }
});

router.post('/activities/:id/publish', async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

    activity.status = 'published';
    await activity.save();

    // Notify students who opted in to new activities
    const students = await User.find({
      role: 'student',
      status: 'approved',
      'notificationPrefs.newActivities': true
    }).select('email firstName').lean();

    // Create in-app notifications in batch
    const notifications = students.map((s) => ({
      userId: s._id,
      type: 'new_activity',
      title: `New activity: ${activity.title}`,
      message: activity.description ? activity.description.slice(0, 100) : '',
      link: `/activities/${activity.slug}`,
      read: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ ok: true, status: 'published' });
  } catch (err) {
    next(err);
  }
});

router.post('/activities/:id/hide', async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

    activity.status = 'hidden';
    await activity.save();

    res.json({ ok: true, status: 'hidden' });
  } catch (err) {
    next(err);
  }
});

// Excel Export for Activity Attendees (strictly NO check-in, NO QR codes)
router.get('/activities/:id/export', async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id).lean();
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

    const rsvps = await Rsvp.find({ activityId: activity._id })
      .populate('userId', 'fullName firstName countryCode email')
      .lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UCV International Community';
    const worksheet = workbook.addWorksheet('RSVPs');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'RSVP Response', key: 'response', width: 16 },
      { header: 'Response Date', key: 'timestamp', width: 20 }
    ];

    for (const r of rsvps) {
      if (r.userId) {
        worksheet.addRow({
          fullName: r.userId.fullName,
          firstName: r.userId.firstName,
          country: getCountryName(r.userId.countryCode),
          response: r.response === 'going' ? "I'm going" : "Can't make it",
          timestamp: r.timestamp ? new Date(r.timestamp).toISOString().split('T')[0] : ''
        });
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${activity.slug}-rsvps.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// 8. Content Manager (Screen 45)
router.get('/content', async (req, res, next) => {
  try {
    const [settings, word, question, phrases, clubAreas] = await Promise.all([
      SiteSettings.findOne({}).lean(),
      WordOfTheMonth.findOne({ isCurrent: true }).lean(),
      MonthlyQuestion.findOne({ isCurrent: true }).lean(),
      Phrase.find({}).sort({ order: 1 }).lean(),
      ClubArea.find({}).sort({ order: 1 }).lean()
    ]);

    res.json({
      settings: settings || {},
      word: word || null,
      wordOfTheMonth: word || null,
      question: question
        ? {
            ...question,
            wallUpvoteColor: question.wallUpvoteColor || settings?.wallUpvoteColor || '#1E7B4C'
          }
        : null,
      questionOfTheMonth: question || null,
      phrases: phrases.map((p) => ({
        id: p._id.toString(),
        romanian: p.romanian,
        pronunciation: p.pronunciation,
        english: p.english,
        order: p.order,
        isPublished: p.isPublished
      })),
      clubAreas: clubAreas.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        description: a.description,
        order: a.order,
        upvoteCount: a.upvoteCount || 0,
        isPublished: a.isPublished
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.put('/content/settings', validate(siteSettingsSchema), async (req, res, next) => {
  try {
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      settings = new SiteSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    if (req.body.wallUpvoteColor) {
      await MonthlyQuestion.updateMany({ isCurrent: true }, { wallUpvoteColor: req.body.wallUpvoteColor });
      notifyWallUpdated({ action: 'color_update', wallUpvoteColor: req.body.wallUpvoteColor });
    }

    res.json({ ok: true, settings });
  } catch (err) {
    next(err);
  }
});

router.put('/content/word', validate(wordOfTheMonthSchema), async (req, res, next) => {
  try {
    let word = await WordOfTheMonth.findOne({ isCurrent: true });
    if (!word) {
      word = new WordOfTheMonth({ ...req.body, isCurrent: true });
    } else {
      Object.assign(word, req.body);
    }
    await word.save();
    res.json({ ok: true, word });
  } catch (err) {
    next(err);
  }
});

router.put('/content/question', validate(questionOfTheMonthSchema), async (req, res, next) => {
  try {
    let q = await MonthlyQuestion.findOne({ isCurrent: true });
    if (!q) {
      q = new MonthlyQuestion({ ...req.body, isCurrent: true });
    } else {
      Object.assign(q, req.body);
    }
    await q.save();

    if (req.body.wallUpvoteColor) {
      await SiteSettings.updateOne({}, { wallUpvoteColor: req.body.wallUpvoteColor });
    }

    notifyWallUpdated({
      action: 'color_update',
      wallUpvoteColor: q.wallUpvoteColor || '#1E7B4C'
    });

    res.json({ ok: true, question: q });
  } catch (err) {
    next(err);
  }
});

router.post('/content/phrases', validate(phraseSchema), async (req, res, next) => {
  try {
    const phrase = await Phrase.create(req.body);
    res.status(201).json({ ok: true, phrase });
  } catch (err) {
    next(err);
  }
});

router.delete('/content/phrases/:id', async (req, res, next) => {
  try {
    await Phrase.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 9. Moderation (Screen 46)
router.get('/moderation', async (req, res, next) => {
  try {
    const [wallPosts, sharedWords] = await Promise.all([
      WallPost.find({})
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName countryCode')
        .populate('questionId', 'question month')
        .lean(),
      SharedWord.find({})
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName countryCode')
        .lean()
    ]);

    const formattedWallPosts = wallPosts.map((p) => ({
      id: p._id.toString(),
      type: 'wall',
      text: p.text,
      state: p.state || 'visible',
      status: p.state || 'visible',
      meTooCount: p.meTooCount || 0,
      createdAt: p.createdAt,
      author: p.userId ? p.userId.fullName : 'Deleted User',
      authorName: p.userId ? p.userId.fullName : 'Deleted User',
      countryName: p.userId ? getCountryName(p.userId.countryCode) : '',
      authorCountry: p.userId ? getCountryName(p.userId.countryCode) : '',
      question: p.questionId ? `${p.questionId.month}: ${p.questionId.question}` : ''
    }));

    const formattedSharedWords = sharedWords.map((w) => ({
      id: w._id.toString(),
      type: 'word',
      word: w.word,
      language: w.language,
      meaning: w.meaning,
      text: `${w.language ? `${w.language}: ` : ''}${w.meaning || ''}`,
      state: w.state || 'visible',
      status: w.state || 'visible',
      createdAt: w.createdAt,
      author: w.userId ? w.userId.fullName : 'Deleted User',
      authorName: w.userId ? w.userId.fullName : 'Deleted User',
      countryName: w.userId ? getCountryName(w.userId.countryCode) : '',
      authorCountry: w.userId ? getCountryName(w.userId.countryCode) : ''
    }));

    const items = [...formattedWallPosts, ...formattedSharedWords].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      items,
      wallPosts: formattedWallPosts,
      sharedWords: formattedSharedWords
    });
  } catch (err) {
    next(err);
  }
});

router.post('/moderation/:type/:id/remove', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (type === 'wall') {
      const post = await WallPost.findByIdAndUpdate(
        id,
        { state: 'removed', removedBy: req.user._id, removedAt: new Date() },
        { new: true }
      );
      notifyWallUpdated({ action: 'remove', postId: id, post });
    } else if (type === 'word') {
      await SharedWord.updateOne({ _id: id }, { state: 'removed' });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'content_removed',
      targetType: type === 'wall' ? 'WallPost' : 'SharedWord',
      targetId: id
    });

    res.json({ ok: true, state: 'removed' });
  } catch (err) {
    next(err);
  }
});

router.post('/moderation/:type/:id/restore', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (type === 'wall') {
      const post = await WallPost.findByIdAndUpdate(
        id,
        { state: 'visible', removedBy: null, removedAt: null },
        { new: true }
      );
      notifyWallUpdated({ action: 'restore', postId: id, post });
    } else if (type === 'word') {
      await SharedWord.updateOne({ _id: id }, { state: 'visible' });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'content_restored',
      targetType: type === 'wall' ? 'WallPost' : 'SharedWord',
      targetId: id
    });

    res.json({ ok: true, state: 'visible' });
  } catch (err) {
    next(err);
  }
});

router.delete('/moderation/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (type === 'wall') {
      await WallPost.deleteOne({ _id: id });
      await MeToo.deleteMany({ wallPostId: id });
      notifyWallUpdated({ action: 'delete', postId: id });
    } else if (type === 'word') {
      await SharedWord.deleteOne({ _id: id });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'content_deleted',
      targetType: type === 'wall' ? 'WallPost' : 'SharedWord',
      targetId: id
    });

    res.json({ ok: true, deleted: true });
  } catch (err) {
    next(err);
  }
});

router.put('/moderation/wall/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, state } = req.body;
    const update = {};
    if (typeof text === 'string') update.text = text.trim();
    if (state) {
      update.state = state;
      if (state === 'removed') {
        update.removedBy = req.user._id;
        update.removedAt = new Date();
      } else if (state === 'visible') {
        update.removedBy = null;
        update.removedAt = null;
      }
    }

    const post = await WallPost.findByIdAndUpdate(id, update, { new: true });
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Wall post not found.' } });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'content_updated',
      targetType: 'WallPost',
      targetId: id
    });

    notifyWallUpdated({ action: 'update', postId: id, post });
    res.json({ ok: true, post });
  } catch (err) {
    next(err);
  }
});

// 10. Clubs Manager (Screen 47)
router.get('/clubs', async (req, res, next) => {
  try {
    const [clubAreas, openClubs, proposals] = await Promise.all([
      ClubArea.find({}).sort({ order: 1 }).lean(),
      Club.find({}).sort({ createdAt: -1 }).lean(),
      ClubProposal.find({})
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName countryCode email')
        .lean()
    ]);

    const areasPayload = clubAreas.map((a) => ({
      id: a._id.toString(),
      _id: a._id.toString(),
      name: a.name,
      title: a.name,
      description: a.description,
      order: a.order || 0,
      upvoteCount: a.upvoteCount || 0,
      status: a.isPublished ? 'published' : 'archived',
      isPublished: a.isPublished
    }));

    const clubsPayload = openClubs.map((c) => ({
      id: c._id.toString(),
      _id: c._id.toString(),
      name: c.name,
      motto: c.motto,
      description: c.description,
      frequency: c.frequency,
      whatsappUrl: c.whatsappUrl,
      whatsappLink: c.whatsappUrl,
      status: c.status,
      memberCount: c.memberCount || 0
    }));

    res.json({
      areas: areasPayload,
      clubAreas: areasPayload,
      clubs: clubsPayload,
      openClubs: clubsPayload,
      proposals: proposals.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        idea: p.idea,
        wantsToHelp: p.wantsToHelp,
        status: p.status,
        createdAt: p.createdAt,
        student: p.userId
          ? {
              id: p.userId._id.toString(),
              fullName: p.userId.fullName,
              email: p.userId.email,
              countryName: getCountryName(p.userId.countryCode)
            }
          : null
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Interest Areas Management
router.post('/clubs/areas', async (req, res, next) => {
  try {
    const name = (req.body.name || req.body.title || '').trim();
    const description = (req.body.description || '').trim();
    if (!name) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Title is required.' } });
    }

    const highestOrderArea = await ClubArea.findOne({}).sort({ order: -1 }).lean();
    const nextOrder = highestOrderArea ? (highestOrderArea.order || 0) + 1 : 0;

    const isPublished = req.body.status !== undefined 
      ? req.body.status === 'published' 
      : (req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true);

    const area = await ClubArea.create({
      name,
      description,
      order: req.body.order !== undefined ? Number(req.body.order) : nextOrder,
      isPublished,
      upvoteCount: 0
    });

    res.status(201).json({
      ok: true,
      area: {
        id: area._id.toString(),
        _id: area._id.toString(),
        name: area.name,
        title: area.name,
        description: area.description,
        order: area.order,
        upvoteCount: area.upvoteCount || 0,
        status: area.isPublished ? 'published' : 'archived',
        isPublished: area.isPublished
      }
    });
  } catch (err) {
    next(err);
  }
});

router.put('/clubs/areas/:id', async (req, res, next) => {
  try {
    const area = await ClubArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Interest area not found.' } });
    }

    if (req.body.name || req.body.title) {
      area.name = (req.body.name || req.body.title).trim();
    }
    if (req.body.description !== undefined) {
      area.description = req.body.description.trim();
    }
    if (req.body.order !== undefined) {
      area.order = Number(req.body.order);
    }
    if (req.body.status !== undefined) {
      area.isPublished = req.body.status === 'published';
    } else if (req.body.isPublished !== undefined) {
      area.isPublished = Boolean(req.body.isPublished);
    }

    await area.save();

    res.json({
      ok: true,
      area: {
        id: area._id.toString(),
        _id: area._id.toString(),
        name: area.name,
        title: area.name,
        description: area.description,
        order: area.order,
        upvoteCount: area.upvoteCount || 0,
        status: area.isPublished ? 'published' : 'archived',
        isPublished: area.isPublished
      }
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/clubs/areas/:id', async (req, res, next) => {
  try {
    const area = await ClubArea.findByIdAndDelete(req.params.id);
    if (!area) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Interest area not found.' } });
    }

    await ClubUpvote.deleteMany({ clubAreaId: req.params.id });

    await AuditLog.create({
      userId: req.user._id,
      action: 'content_removed',
      targetType: 'ClubArea',
      targetId: req.params.id,
      meta: { name: area.name }
    });

    res.json({ ok: true, deleted: true, name: area.name });
  } catch (err) {
    next(err);
  }
});

router.post('/clubs', validate(openClubSchema), async (req, res, next) => {
  try {
    const club = await Club.create({
      ...req.body,
      memberCount: 0
    });
    res.status(201).json({ ok: true, club });
  } catch (err) {
    next(err);
  }
});

router.put('/clubs/:id', validate(openClubSchema), async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Club not found.' } });
    }
    Object.assign(club, req.body);
    await club.save();
    res.json({ ok: true, club });
  } catch (err) {
    next(err);
  }
});

router.patch('/clubs/proposals/:id', validate(proposalStatusSchema), async (req, res, next) => {
  try {
    const proposal = await ClubProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Proposal not found.' } });
    }
    proposal.status = req.body.status;
    await proposal.save();
    res.json({ ok: true, proposal });
  } catch (err) {
    next(err);
  }
});

// 11. Ambassadors Manager (Screen 44)
router.get('/ambassadors', async (req, res, next) => {
  try {
    const [applications, ambassadors] = await Promise.all([
      AmbassadorApplication.find({ status: { $in: ['pending', 'applied'] } })
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName countryCode email mobile')
        .lean(),
      User.find({ role: 'student', isAmbassador: true })
        .sort({ fullName: 1 })
        .lean()
    ]);

    res.json({
      pendingApplications: applications.map((a) => ({
        id: a._id.toString(),
        why: a.why,
        languages: a.languages,
        hoursPerMonth: a.hoursPerMonth,
        createdAt: a.createdAt,
        student: a.userId
          ? {
              id: a.userId._id.toString(),
              fullName: a.userId.fullName,
              email: a.userId.email,
              mobile: a.userId.mobile,
              countryName: getCountryName(a.userId.countryCode)
            }
          : null
      })),
      ambassadors: ambassadors.map((s) => ({
        id: s._id.toString(),
        fullName: s.fullName,
        countryName: getCountryName(s.countryCode),
        email: s.email,
        mobile: s.mobile || '',
        loggedHours: s.ambassadorHoursLogged || 0,
        history: s.ambassadorHistory || []
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/ambassadors/:id/approve', async (req, res, next) => {
  try {
    const app = await AmbassadorApplication.findById(req.params.id).populate('userId');
    if (!app) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    }

    app.status = 'approved';
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    await app.save();

    if (app.userId) {
      app.userId.isAmbassador = true;
      await app.userId.save();

      await Notification.create({
        userId: app.userId._id,
        type: 'community_update',
        title: 'Ambassador application accepted!',
        message: 'Welcome to the UCV International Student Ambassadors team.',
        link: '/student/ambassadors',
        read: false
      });
    }

    res.json({ ok: true, status: 'approved' });
  } catch (err) {
    next(err);
  }
});

router.post('/ambassadors/:id/not-now', async (req, res, next) => {
  try {
    const app = await AmbassadorApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
    }

    app.status = 'not_now';
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    await app.save();

    res.json({ ok: true, status: 'not_now' });
  } catch (err) {
    next(err);
  }
});

router.post('/ambassadors/hours', validate(logHoursSchema), async (req, res, next) => {
  try {
    const { studentId, date, hours, whatDidTheyDo } = req.body;
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }

    student.ambassadorHoursLogged = (student.ambassadorHoursLogged || 0) + hours;
    student.ambassadorHistory = student.ambassadorHistory || [];
    student.ambassadorHistory.push({
      date,
      hours,
      whatDidTheyDo,
      loggedBy: req.user._id
    });

    await student.save();
    res.json({ ok: true, loggedHours: student.ambassadorHoursLogged });
  } catch (err) {
    next(err);
  }
});

// Bulk PDF Volunteering Certificates (Screen 44)
router.get('/ambassadors/certificates', async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne({}).lean();
    const threshold = settings?.certificateHours || 10;
    const readyStudents = await User.find({
      role: 'student',
      isAmbassador: true,
      ambassadorHoursLogged: { $gte: threshold }
    }).sort({ fullName: 1 }).lean();

    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', autoFirstPage: false });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ucv-ambassador-certificates.pdf"');
    doc.pipe(res);

    if (readyStudents.length === 0) {
      doc.addPage();
      doc.rect(20, 20, 802, 555).lineWidth(4).strokeColor('#18203A').stroke();
      doc.rect(26, 26, 790, 543).lineWidth(1.5).strokeColor('#E0A200').stroke();
      doc.moveDown(5);
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#18203A').text('UNIVERSITY OF CRAIOVA', { align: 'center' });
      doc.font('Helvetica').fontSize(16).fillColor('#4A536B').text(`No ambassadors have reached the ${threshold}-hour certificate threshold yet.`, { align: 'center' });
    } else {
      for (const student of readyStudents) {
        doc.addPage();
        doc.rect(20, 20, 802, 555).lineWidth(4).strokeColor('#18203A').stroke();
        doc.rect(26, 26, 790, 543).lineWidth(1.5).strokeColor('#E0A200').stroke();

        doc.moveDown(3);
        doc.font('Helvetica-Bold').fontSize(36).fillColor('#18203A').text('UNIVERSITY OF CRAIOVA', { align: 'center' });
        doc.font('Helvetica').fontSize(16).fillColor('#B42318').text('Department of International Relations', { align: 'center' });
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').fontSize(26).fillColor('#E0A200').text('CERTIFICATE OF VOLUNTEERING', { align: 'center' });
        doc.moveDown(1);

        doc.font('Helvetica').fontSize(16).fillColor('#18203A').text('This is proudly presented to', { align: 'center' });
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').fontSize(32).fillColor('#18203A').text(student.fullName, { align: 'center' });
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(15).fillColor('#4A536B').text(
          `for exceptional service and active contribution as an International Student Ambassador,\n` +
          `completing ${student.ambassadorHoursLogged || 0} hours of dedicated community support and intercultural guidance.`,
          { align: 'center', lineGap: 4 }
        );

        doc.moveDown(2);
        doc.fontSize(12).fillColor('#18203A').text(`Craiova, Romania — ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
      }
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

// Single PDF Volunteering Certificate
router.get('/ambassadors/:id/certificate', async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });
    }

    const settings = await SiteSettings.findOne({}).lean();
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${student.firstName}.pdf"`);

    doc.pipe(res);

    // Certificate Border & Background
    doc.rect(20, 20, 802, 555).lineWidth(4).strokeColor('#18203A').stroke();
    doc.rect(26, 26, 790, 543).lineWidth(1.5).strokeColor('#E0A200').stroke();

    doc.moveDown(3);
    doc.font('Helvetica-Bold').fontSize(36).fillColor('#18203A').text('UNIVERSITY OF CRAIOVA', { align: 'center' });
    doc.font('Helvetica').fontSize(16).fillColor('#B42318').text('Department of International Relations', { align: 'center' });
    doc.moveDown(1.5);

    doc.font('Helvetica-Bold').fontSize(26).fillColor('#E0A200').text('CERTIFICATE OF VOLUNTEERING', { align: 'center' });
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(16).fillColor('#18203A').text('This is proudly presented to', { align: 'center' });
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').fontSize(32).fillColor('#18203A').text(student.fullName, { align: 'center' });
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(15).fillColor('#4A536B').text(
      `for exceptional service and active contribution as an International Student Ambassador,\n` +
      `completing ${student.ambassadorHoursLogged || 0} hours of dedicated community support and intercultural guidance.`,
      { align: 'center', lineGap: 4 }
    );

    doc.moveDown(2);
    doc.fontSize(12).fillColor('#18203A').text(`Craiova, Romania — ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
});

// 12. Staff Accounts (Screen 49 - Admin Only)
router.get('/accounts', requireAdmin, async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      accounts: staff.map((s) => ({
        id: s._id.toString(),
        fullName: s.fullName,
        email: s.email,
        role: s.role,
        status: s.status,
        isPermanentAdmin: s.isPermanentAdmin || false,
        createdAt: s.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/accounts/invite', requireAdmin, async (req, res, next) => {
  try {
    const { fullName, email, role = 'staff' } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Name and email are required.' } });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' } });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 chars
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash(tempPassword, 12);

    const parts = fullName.trim().split(/\s+/);
    const staff = await User.create({
      fullName,
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || parts[0],
      email: email.toLowerCase(),
      countryCode: 'RO',
      role: 'staff',
      status: 'invited',
      temporaryPasswordHash: hash,
      tempPasswordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      mustChangePassword: true,
      joinSource: 'invitation'
    });

    const emailContent = renderTemplate('staffInvite', {
      inviterName: req.user?.fullName || env.ADMIN_NAME || 'Staff Administrator',
      fullName: staff.fullName,
      email: staff.email,
      tempPassword,
       loginUrl: `${getAppUrl()}/staff/login`
    });

    await queueEmail({
      recipient: staff.email,
      type: 'staff_invite',
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      priority: 1,
      idempotencyKey: `staff_invite_${staff._id}`
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'staff_invited',
      targetType: 'User',
      targetId: staff._id.toString(),
      meta: { email: staff.email, role: staff.role }
    });

    res.status(201).json({ ok: true, account: staff });
  } catch (err) {
    next(err);
  }
});

router.post('/accounts/:id/remove', requireAdmin, async (req, res, next) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
    }

    if (staff.isPermanentAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Permanent administrator account cannot be deactivated.' } });
    }

    staff.status = 'removed';
    await staff.save();

    // Terminate all active sessions immediately
    await Session.deleteMany({ userId: staff._id });

    await AuditLog.create({
      userId: req.user._id,
      action: 'staff_access_removed',
      targetType: 'User',
      targetId: staff._id.toString(),
      meta: { email: staff.email }
    });

    res.json({ ok: true, status: 'removed' });
  } catch (err) {
    next(err);
  }
});

router.post('/accounts/:id/restore', requireAdmin, async (req, res, next) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
    }

    staff.status = 'active';
    await staff.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'staff_access_restored',
      targetType: 'User',
      targetId: staff._id.toString(),
      meta: { email: staff.email }
    });

    res.json({ ok: true, status: 'active' });
  } catch (err) {
    next(err);
  }
});

router.post('/accounts/:id/resend', requireAdmin, async (req, res, next) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || !['staff', 'admin'].includes(staff.role)) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Staff account not found.' } });
    }

    if (staff.isPermanentAdmin || staff.email === 'sanjana.singh111910@gmail.com') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Permanent administrator account credentials cannot be reset.' } });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash(tempPassword, 12);

    staff.temporaryPasswordHash = hash;
    staff.tempPasswordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    staff.mustChangePassword = true;
    staff.status = 'invited';
    await staff.save();

    const emailContent = renderTemplate('staffInvite', {
      inviterName: req.user?.fullName || env.ADMIN_NAME || 'Staff Administrator',
      fullName: staff.fullName,
      email: staff.email,
      tempPassword,
      loginUrl: `${getAppUrl()}/staff/login`
    });

    await queueEmail({
      recipient: staff.email,
      type: 'staff_invite',
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      priority: 1,
      idempotencyKey: `staff_invite_resend_${staff._id}_${Date.now()}`
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'staff_invitation_resent',
      targetType: 'User',
      targetId: staff._id.toString(),
      meta: { email: staff.email }
    });

    res.json({ ok: true, message: `Invitation resent to ${staff.email}.` });
  } catch (err) {
    next(err);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.tsv', '.txt'];
    const originalName = (file.originalname || '').toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => originalName.endsWith(ext));
    const allowedMimes = [
      'text/csv',
      'text/plain',
      'text/tab-separated-values',
      'application/vnd.ms-excel',
      'application/csv'
    ];

    if (hasValidExt || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only CSV, TSV, or TXT tabular files are supported.'));
    }
  }
});

router.post('/import/preview', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    }

    const content = req.file.buffer.toString('utf-8');
    const firstLine = content.split('\n')[0] || '';
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
      relax_column_count: true
    });

    const rows = [];
    let newCount = 0;
    let updateCount = 0;
    let missingEmailCount = 0;
    let fixCount = 0;

    let rowNum = 1;
    for (const raw of records) {
      rowNum++;
      const keys = Object.keys(raw);
      const getVal = (patterns) => {
        for (const k of keys) {
          const lower = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const p of patterns) {
            if (lower === p || lower.includes(p)) return raw[k]?.trim() || '';
          }
        }
        return '';
      };

      const fullNameRaw = getVal(['fullname', 'name', 'nume', 'studentname']);
      const firstNameRaw = getVal(['firstname', 'prenume']);
      const lastNameRaw = getVal(['lastname', 'surname', 'numedefamilie']);
      const emailRaw = getVal(['email', 'mail']).toLowerCase();
      const mobileRaw = getVal(['mobile', 'phone', 'telefon']);
      const countryRaw = getVal(['country', 'tara', 'nationality', 'countrycode']);
      const facultyRaw = getVal(['faculty', 'facultate']);

      let fullName = fullNameRaw;
      let firstName = firstNameRaw;
      let lastName = lastNameRaw;

      if (!fullName && (firstName || lastName)) {
        fullName = `${firstName} ${lastName}`.trim();
      } else if (fullName && !firstName) {
        const parts = fullName.split(/\s+/);
        firstName = parts[0];
        lastName = parts.slice(1).join(' ') || parts[0];
      }

      const countryCode = resolveCountryCode(countryRaw);

      let status = 'new';
      let issue = '';

      if (!fullName) {
        status = 'fix';
        issue = 'Missing student name';
      } else if (!countryCode) {
        status = 'fix';
        issue = `Unrecognised country "${countryRaw}"`;
      } else if (!emailRaw) {
        status = 'missing_email';
        missingEmailCount++;
      } else {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
        if (!emailValid) {
          status = 'fix';
          issue = `Invalid email "${emailRaw}"`;
        } else {
          const existing = await User.findOne({ email: emailRaw });
          if (existing) {
            status = 'update';
            updateCount++;
          } else {
            status = 'new';
            newCount++;
          }
        }
      }

      if (status === 'fix') {
        fixCount++;
      }

      rows.push({
        rowNumber: rowNum,
        fullName: fullName || 'Unknown',
        firstName: firstName || 'Unknown',
        email: emailRaw || '',
        mobile: mobileRaw || '',
        countryCode: countryCode || '',
        faculty: facultyRaw || '',
        status,
        issue
      });
    }

    const job = await ImportJob.create({
      adminId: req.user._id,
      filename: req.file.originalname,
      rows,
      counts: {
        newCount,
        updateCount,
        missingEmailCount,
        fixCount
      }
    });

    res.json({
      jobId: job._id.toString(),
      filename: job.filename,
      counts: job.counts,
      rows: job.rows
    });
  } catch (err) {
    next(err);
  }
});

router.post('/import/commit', requireAdmin, async (req, res, next) => {
  try {
    const { jobId, sendInvites = false } = req.body;
    const job = await ImportJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Import preview expired or not found.' } });
    }

    let importedCount = 0;
    for (const r of job.rows) {
      if (r.status === 'fix') continue;

      let user = null;
      if (r.email) {
        user = await User.findOne({ email: r.email });
      }

      if (user) {
        if (r.fullName) user.fullName = r.fullName;
        if (r.firstName) user.firstName = r.firstName;
        if (r.countryCode) user.countryCode = r.countryCode;
        if (r.mobile) user.mobile = r.mobile;
        if (r.faculty) user.faculty = r.faculty;
        await user.save();
      } else {
        const parts = r.fullName.split(/\s+/);
        const firstName = r.firstName || parts[0];
        const lastName = parts.slice(1).join(' ') || firstName;

        user = await User.create({
          fullName: r.fullName,
          firstName,
          lastName,
          email: r.email || null,
          mobile: r.mobile || '',
          countryCode: r.countryCode,
          faculty: r.faculty || '',
          role: 'student',
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: req.user._id,
          joinSource: 'import',
          consentDate: new Date()
        });
      }

      if (sendInvites && r.email) {
        const emailContent = renderTemplate('approval', {
          firstName: r.firstName,
          fullName: `${r.firstName} ${r.lastName || ''}`.trim(),
          loginUrl: `${getAppUrl()}/signin`
        });

        await queueEmail({
          recipient: r.email,
          type: 'approval',
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          priority: 2,
          idempotencyKey: `approval_import_${job._id}_${r.email.toLowerCase().trim()}`
        });
      }

      importedCount++;
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'students_imported',
      targetType: 'ImportJob',
      targetId: job._id.toString(),
      meta: { filename: job.filename, importedCount }
    });

    await ImportJob.deleteOne({ _id: job._id });

    notifyMapUpdated();

    res.json({ ok: true, importedCount });
  } catch (err) {
    next(err);
  }
});

// 14. Reports (Screen 48)
router.get('/reports/summary', async (req, res, next) => {
  try {
    const { semester = 'autumn-2026' } = req.query;
    const semRange = getSemesterRange(semester);

    const [
      studentsInSemester,
      allApprovedStudents,
      countryAgg,
      activitiesInSemester,
      openClubs,
      ambassadorHoursAgg
    ] = await Promise.all([
      User.countDocuments({
        role: 'student',
        status: 'approved',
        createdAt: { $gte: semRange.start, $lte: semRange.end }
      }),
      User.countDocuments({ role: 'student', status: 'approved' }),
      User.aggregate([
        { $match: { role: 'student', status: 'approved' } },
        { $group: { _id: '$countryCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Activity.find({
        status: 'published',
        date: { $gte: semRange.start, $lte: semRange.end }
      }).sort({ date: 1 }).lean(),
      Club.find({ status: 'published' }).lean(),
      User.aggregate([
        { $match: { role: 'student', isAmbassador: true } },
        { $group: { _id: null, totalHours: { $sum: '$ambassadorHoursLogged' } } }
      ])
    ]);

    // Calculate total going answers in this semester's activities
    const activityIds = activitiesInSemester.map((a) => a._id);
    const totalGoingAnswers = await Rsvp.countDocuments({
      activityId: { $in: activityIds },
      response: 'going'
    });

    const totalHours = ambassadorHoursAgg[0]?.totalHours || 0;

    res.json({
      semester: semRange.name,
      semesterId: semRange.id,
      studentsRegistered: studentsInSemester || allApprovedStudents,
      totalStudents: allApprovedStudents,
      countriesCount: countryAgg.length,
      activitiesHeld: activitiesInSemester.length,
      totalGoingAnswers,
      byCountry: countryAgg.map((c) => ({
        countryCode: c._id,
        countryName: getCountryName(c._id),
        count: c.count
      })),
      activities: activitiesInSemester.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        date: a.date,
        goingCount: a.goingCount || 0,
        feedbackCount: a.feedbackCount || 0
      })),
      clubs: openClubs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        memberCount: c.memberCount || 0
      })),
      totalAmbassadorHours: totalHours
    });
  } catch (err) {
    next(err);
  }
});

// PDF Semester Summary (Screen 48)
router.get('/reports/semester-summary.pdf', async (req, res, next) => {
  try {
    const { semester = 'autumn-2026' } = req.query;
    const semRange = getSemesterRange(semester);

    const [
      studentsCount,
      countryAgg,
      activities,
      totalGoing
    ] = await Promise.all([
      User.countDocuments({ role: 'student', status: 'approved' }),
      User.aggregate([
        { $match: { role: 'student', status: 'approved' } },
        { $group: { _id: '$countryCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Activity.find({
        status: 'published',
        date: { $gte: semRange.start, $lte: semRange.end }
      }).sort({ date: 1 }).lean(),
      Rsvp.countDocuments({ response: 'going' })
    ]);

    const doc = new PDFDocument({ layout: 'portrait', size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ucv-semester-summary-${semRange.id}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#18203A').text('UNIVERSITY OF CRAIOVA', { align: 'center' });
    doc.fontSize(14).font('Helvetica').fillColor('#B42318').text('Department of International Relations — International Student Community', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#E0A200').text(`Semester Summary: ${semRange.name}`, { align: 'center' });
    doc.moveDown(1);

    // KPI Box
    doc.rect(40, 120, 515, 70).lineWidth(1).strokeColor('#D9DDE6').stroke();
    doc.fontSize(11).font('Helvetica').fillColor('#4A536B');
    doc.text('Students registered', 55, 130);
    doc.text('Countries represented', 185, 130);
    doc.text('Activities held', 335, 130);
    doc.text('Total "going" answers', 445, 130);

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#18203A');
    doc.text(String(studentsCount), 55, 150);
    doc.text(String(countryAgg.length), 185, 150);
    doc.text(String(activities.length), 335, 150);
    doc.text(String(totalGoing), 445, 150);

    doc.moveDown(5);

    // Activities Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#18203A').text('Activities held during semester:', 40, 210);
    doc.moveDown(0.5);

    let y = 230;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#4A536B');
    doc.text('Activity', 40, y);
    doc.text('Date', 340, y);
    doc.text('Said going', 470, y);
    y += 18;

    doc.font('Helvetica').fillColor('#18203A');
    if (activities.length === 0) {
      doc.text('No activities recorded for this period.', 40, y);
      y += 20;
    } else {
      for (const act of activities) {
        doc.text(act.title, 40, y, { width: 280, ellipsis: true });
        doc.text(act.date ? new Date(act.date).toLocaleDateString('en-GB') : 'TBC', 340, y);
        doc.text(String(act.goingCount || 0), 470, y);
        y += 18;
      }
    }

    y += 20;
    // Countries Section
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#18203A').text('Country representation (Top 10):', 40, y);
    y += 20;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#4A536B');
    doc.text('Country', 40, y);
    doc.text('Code', 340, y);
    doc.text('Students', 470, y);
    y += 18;

    doc.font('Helvetica').fillColor('#18203A');
    const topCountries = countryAgg.slice(0, 10);
    for (const c of topCountries) {
      doc.text(getCountryName(c._id), 40, y);
      doc.text(c._id, 340, y);
      doc.text(String(c.count), 470, y);
      y += 18;
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#7E879E').text(`Generated on ${new Date().toLocaleDateString('en-GB')} by UCV International Student Community platform.`, 40, 750, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
});

// Excel Export: Countries and Faculties
router.get('/reports/countries-faculties/excel', async (req, res, next) => {
  try {
    const { semester = 'autumn-2026' } = req.query;
    const [countryAgg, facultyAgg] = await Promise.all([
      User.aggregate([
        { $match: { role: 'student', status: 'approved' } },
        { $group: { _id: '$countryCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.aggregate([
        { $match: { role: 'student', status: 'approved' } },
        { $group: { _id: '$faculty', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UCV International Community';

    const wsCountries = workbook.addWorksheet('Countries');
    wsCountries.views = [{ state: 'frozen', ySplit: 1 }];
    wsCountries.columns = [
      { header: 'Country Code', key: 'code', width: 15 },
      { header: 'Country Name', key: 'name', width: 30 },
      { header: 'Student Count', key: 'count', width: 16 }
    ];
    wsCountries.getRow(1).font = { bold: true };
    for (const c of countryAgg) {
      wsCountries.addRow({
        code: sanitizeCell(c._id),
        name: sanitizeCell(getCountryName(c._id)),
        count: c.count
      });
    }

    const wsFaculties = workbook.addWorksheet('Faculties');
    wsFaculties.views = [{ state: 'frozen', ySplit: 1 }];
    wsFaculties.columns = [
      { header: 'Faculty', key: 'faculty', width: 40 },
      { header: 'Student Count', key: 'count', width: 16 }
    ];
    wsFaculties.getRow(1).font = { bold: true };
    for (const f of facultyAgg) {
      wsFaculties.addRow({
        faculty: sanitizeCell(f._id || 'Not specified'),
        count: f.count
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ucv-countries-faculties-${semester}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// Excel Export: Engagement
router.get('/reports/engagement/excel', async (req, res, next) => {
  try {
    const { semester = 'autumn-2026' } = req.query;
    const students = await User.find({ role: 'student', status: 'approved' }).sort({ fullName: 1 }).lean();
    const rsvps = await Rsvp.find({ response: 'going' }).lean();

    const goingMap = {};
    for (const r of rsvps) {
      const uid = r.userId?.toString();
      if (uid) goingMap[uid] = (goingMap[uid] || 0) + 1;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UCV International Community';
    const ws = workbook.addWorksheet('Student Engagement');
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.columns = [
      { header: 'Full Name', key: 'name', width: 28 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Faculty', key: 'faculty', width: 30 },
      { header: 'Programme', key: 'programme', width: 25 },
      { header: 'Activities "Going"', key: 'goingCount', width: 20 }
    ];
    ws.getRow(1).font = { bold: true };

    for (const s of students) {
      ws.addRow({
        name: sanitizeCell(s.fullName),
        country: sanitizeCell(getCountryName(s.countryCode)),
        faculty: sanitizeCell(s.faculty || '—'),
        programme: sanitizeCell(s.programme || '—'),
        goingCount: goingMap[s._id.toString()] || 0
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ucv-engagement-${semester}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// Excel Export: Questions
router.get('/reports/questions/excel', async (req, res, next) => {
  try {
    const { semester = 'autumn-2026' } = req.query;
    const questions = await Question.find({})
      .populate('userId', 'fullName countryCode')
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UCV International Community';
    const ws = workbook.addWorksheet('Questions');
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.columns = [
      { header: 'Date Asked', key: 'date', width: 15 },
      { header: 'Student Name', key: 'student', width: 25 },
      { header: 'Country', key: 'country', width: 18 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Question', key: 'question', width: 45 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Answer', key: 'answer', width: 45 },
      { header: 'Answered At', key: 'answeredAt', width: 15 }
    ];
    ws.getRow(1).font = { bold: true };

    for (const q of questions) {
      ws.addRow({
        date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : '',
        student: sanitizeCell(q.userId?.fullName || 'Anonymous'),
        country: sanitizeCell(q.userId?.countryCode ? getCountryName(q.userId.countryCode) : ''),
        category: sanitizeCell(q.category),
        question: sanitizeCell(q.text),
        status: sanitizeCell(q.status),
        answer: sanitizeCell(q.answer?.text || ''),
        answeredAt: q.answer?.answeredAt ? new Date(q.answer.answeredAt).toISOString().split('T')[0] : ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ucv-questions-${semester}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// Excel Export: Clubs & Interests
router.get('/reports/clubs/excel', async (req, res, next) => {
  try {
    const { semester = 'autumn-2026' } = req.query;
    const [areas, proposals] = await Promise.all([
      ClubArea.find({}).sort({ upvotesCount: -1 }).lean(),
      ClubProposal.find({}).populate('userId', 'fullName countryCode').sort({ createdAt: -1 }).lean()
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UCV International Community';

    const wsAreas = workbook.addWorksheet('Interest Areas');
    wsAreas.views = [{ state: 'frozen', ySplit: 1 }];
    wsAreas.columns = [
      { header: 'Area Name', key: 'name', width: 30 },
      { header: 'Upvotes', key: 'upvotes', width: 14 },
      { header: 'Status', key: 'status', width: 14 }
    ];
    wsAreas.getRow(1).font = { bold: true };
    for (const a of areas) {
      wsAreas.addRow({
        name: sanitizeCell(a.name),
        upvotes: a.upvotesCount || 0,
        status: sanitizeCell(a.status)
      });
    }

    const wsProp = workbook.addWorksheet('Proposals');
    wsProp.views = [{ state: 'frozen', ySplit: 1 }];
    wsProp.columns = [
      { header: 'Club Name', key: 'name', width: 30 },
      { header: 'Proposed By', key: 'student', width: 25 },
      { header: 'Country', key: 'country', width: 18 },
      { header: 'Wants to Help', key: 'help', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Description', key: 'desc', width: 45 }
    ];
    wsProp.getRow(1).font = { bold: true };
    for (const p of proposals) {
      wsProp.addRow({
        name: sanitizeCell(p.name),
        student: sanitizeCell(p.userId?.fullName || 'Unknown'),
        country: sanitizeCell(p.userId?.countryCode ? getCountryName(p.userId.countryCode) : ''),
        help: p.wantsToHelp ? 'Yes' : 'No',
        status: sanitizeCell(p.status),
        desc: sanitizeCell(p.description)
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ucv-club-interest-${semester}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// Excel Export: Ambassadors
router.get('/reports/ambassadors/excel', async (req, res, next) => {
  try {
    const { semester = 'autumn-2026' } = req.query;
    const settings = await SiteSettings.findOne({}).lean();
    const threshold = settings?.certificateHours || 10;

    const [ambassadors, applications] = await Promise.all([
      User.find({ role: 'student', isAmbassador: true }).sort({ fullName: 1 }).lean(),
      AmbassadorApplication.find({}).populate('userId', 'fullName countryCode').sort({ createdAt: -1 }).lean()
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'UCV International Community';

    const wsAmb = workbook.addWorksheet('Active Ambassadors');
    wsAmb.views = [{ state: 'frozen', ySplit: 1 }];
    wsAmb.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Hours Logged', key: 'hours', width: 16 },
      { header: 'Certificate Ready', key: 'ready', width: 18 }
    ];
    wsAmb.getRow(1).font = { bold: true };
    for (const a of ambassadors) {
      wsAmb.addRow({
        name: sanitizeCell(a.fullName),
        country: sanitizeCell(getCountryName(a.countryCode)),
        email: sanitizeCell(a.email || ''),
        hours: a.ambassadorHoursLogged || 0,
        ready: (a.ambassadorHoursLogged || 0) >= threshold ? 'Yes' : 'No'
      });
    }

    const wsApps = workbook.addWorksheet('Applications');
    wsApps.views = [{ state: 'frozen', ySplit: 1 }];
    wsApps.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Languages', key: 'languages', width: 25 },
      { header: 'Hours / Month', key: 'hours', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Why Ambassador', key: 'why', width: 45 }
    ];
    wsApps.getRow(1).font = { bold: true };
    for (const app of applications) {
      wsApps.addRow({
        name: sanitizeCell(app.userId?.fullName || 'Unknown'),
        country: sanitizeCell(app.userId?.countryCode ? getCountryName(app.userId.countryCode) : ''),
        languages: sanitizeCell(app.languages || ''),
        hours: sanitizeCell(app.hoursPerMonth || ''),
        status: sanitizeCell(app.status),
        why: sanitizeCell(app.why || '')
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ucv-ambassadors-${semester}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
