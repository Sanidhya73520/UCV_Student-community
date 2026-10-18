import { Router } from 'express';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { Rsvp } from '../models/Rsvp.js';
import { Feedback } from '../models/Feedback.js';
import { Question } from '../models/Question.js';
import { MonthlyQuestion } from '../models/MonthlyQuestion.js';
import { WallPost } from '../models/WallPost.js';
import { WordOfTheMonth } from '../models/WordOfTheMonth.js';
import { Phrase } from '../models/Phrase.js';
import { SharedWord } from '../models/SharedWord.js';
import { Club } from '../models/Club.js';
import { ClubArea } from '../models/ClubArea.js';
import { ClubUpvote } from '../models/ClubUpvote.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { ClubProposal } from '../models/ClubProposal.js';
import { AmbassadorApplication } from '../models/AmbassadorApplication.js';
import { Notification } from '../models/Notification.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { getCountryName } from '../../../shared/countries.js';
import { notifyActivityUpdated } from '../services/activityBroadcaster.js';
import { notifyWallUpdated } from '../services/wallBroadcaster.js';
import { MeToo } from '../models/MeToo.js';
import { requireAuth, requireStudent } from '../middleware/session.js';
import { validate } from '../middleware/validate.js';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  updateProfileSchema,
  askQuestionSchema,
  wallPostSchema,
  shareWordSchema,
  proposeClubSchema,
  applyAmbassadorSchema,
  rsvpSchema,
  feedbackSchema
} from '../../../shared/schemas/student.js';

const router = Router();

// Protect all routes with student session checks
router.use(requireAuth, requireStudent);

// 1. Dashboard Aggregation (Screen 23)
router.get('/dashboard', async (req, res, next) => {
  try {
    const student = req.user;
    const now = new Date();

    // Robustly find active monthly question
    let currentQuestion = await MonthlyQuestion.findOne({ isPublished: true, isCurrent: true }).lean();
    if (!currentQuestion) {
      currentQuestion = (await MonthlyQuestion.findOne({ isPublished: true }).lean()) || (await MonthlyQuestion.findOne().sort({ createdAt: -1 }).lean());
    }

    const voterKeys = [student._id.toString()];
    if (req.cookies?.voterKey) {
      voterKeys.push(req.cookies.voterKey);
    }

    const [
      publishedActs,
      userRsvps,
      myQuestions,
      myWallPost,
      wordOfTheMonth,
      mySharedWord,
      myUpvotes,
      myProposals,
      ambassadorApp,
      unreadCount
    ] = await Promise.all([
      // All published activities (ordered by date ascending)
      Activity.find({
        status: 'published'
      })
        .sort({ date: 1, createdAt: 1 })
        .lean(),

      // Current user's RSVPs
      Rsvp.find({ userId: student._id }).lean(),

      // Last 3 questions asked by student
      Question.find({ userId: student._id }).sort({ createdAt: -1 }).limit(3).lean(),

      // Current user's wall post for this question (or latest post by this user)
      currentQuestion
        ? WallPost.findOne({ userId: student._id, questionId: currentQuestion._id })
            .lean()
            .then((p) => p || WallPost.findOne({ userId: student._id }).sort({ createdAt: -1 }).lean())
        : WallPost.findOne({ userId: student._id }).sort({ createdAt: -1 }).lean(),

      // Word of the month
      WordOfTheMonth.findOne({ isPublished: true, isCurrent: true }).lean(),

      // User's latest shared word
      SharedWord.findOne({ userId: student._id }).sort({ createdAt: -1 }).lean(),

      // Upvoted club areas
      ClubUpvote.find({ voterKey: { $in: voterKeys } })
        .populate('clubAreaId', 'name')
        .lean(),

      // Club proposals by user
      ClubProposal.find({ userId: student._id }).sort({ createdAt: -1 }).lean(),

      // Ambassador application
      AmbassadorApplication.findOne({ userId: student._id }).lean(),

      // Unread notifications
      Notification.countDocuments({ userId: student._id, read: false })
    ]);

    const rsvpMap = {};
    for (const r of userRsvps) {
      rsvpMap[r.activityId.toString()] = r.response;
    }

    const activities = publishedActs.map((a) => ({
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
      goingCount: a.goingCount || 0,
      notGoingCount: a.notGoingCount || 0,
      userRsvp: rsvpMap[a._id.toString()] || null
    }));

    res.json({
      student: {
        id: student._id.toString(),
        fullName: student.fullName,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        mobile: student.mobile || '',
        countryCode: student.countryCode,
        countryName: getCountryName(student.countryCode),
        programme: student.programme,
        faculty: student.faculty
      },
      activities,
      nextActivity: activities.length > 0 ? activities[0] : null,
      myQuestions: myQuestions.map((q) => ({
        id: q._id.toString(),
        topic: q.topic,
        text: q.text,
        status: q.status,
        answer: q.answer,
        answeredAt: q.answeredAt,
        createdAt: q.createdAt
      })),
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion._id.toString(),
            month: currentQuestion.month,
            question: currentQuestion.question,
            createdAt: currentQuestion.createdAt
          }
        : null,
      myWallPost: myWallPost
        ? {
            id: myWallPost._id.toString(),
            text: myWallPost.text,
            state: myWallPost.state,
            meTooCount: myWallPost.meTooCount || 0,
            createdAt: myWallPost.createdAt
          }
        : null,
      wordOfTheMonth: wordOfTheMonth
        ? {
            id: wordOfTheMonth._id.toString(),
            month: wordOfTheMonth.month,
            word: wordOfTheMonth.word,
            meaning: wordOfTheMonth.meaning
          }
        : null,
      mySharedWord: mySharedWord
        ? {
            id: mySharedWord._id.toString(),
            word: mySharedWord.word,
            language: mySharedWord.language,
            meaning: mySharedWord.meaning,
            createdAt: mySharedWord.createdAt
          }
        : null,
      myUpvotes: Array.from(
        new Map(
          myUpvotes
            .filter((u) => u.clubAreaId)
            .map((u) => [u.clubAreaId._id.toString(), { id: u.clubAreaId._id.toString(), name: u.clubAreaId.name }])
        ).values()
      ),
      myProposals: myProposals.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        idea: p.idea || '',
        wantsToHelp: Boolean(p.wantsToHelp),
        status: p.status || 'received',
        createdAt: p.createdAt
      })),
      ambassadorStatus: ambassadorApp ? ambassadorApp.status : (student.isAmbassador ? 'approved' : 'not_applied'),
      myAmbassadorApplication: ambassadorApp
        ? {
            id: ambassadorApp._id.toString(),
            status: ambassadorApp.status,
            why: ambassadorApp.why,
            languages: ambassadorApp.languages,
            hoursPerMonth: ambassadorApp.hoursPerMonth,
            createdAt: ambassadorApp.createdAt
          }
        : null,
      isAmbassador: Boolean(student.isAmbassador || (ambassadorApp && (ambassadorApp.status === 'approved' || ambassadorApp.status === 'accepted'))),
      ambassadorHoursLogged: student.ambassadorHoursLogged || 0,
      unreadNotificationsCount: unreadCount
    });
  } catch (err) {
    next(err);
  }
});

// 2. Events & RSVPs (Screen 24)
router.get('/events', async (req, res, next) => {
  try {
    const student = req.user;
    const now = new Date();

    const [activities, rsvps, feedbacks] = await Promise.all([
      Activity.find({ status: 'published' }).sort({ date: 1, createdAt: 1 }).lean(),
      Rsvp.find({ userId: student._id }).lean(),
      Feedback.find({ userId: student._id }).lean()
    ]);

    const rsvpMap = {};
    for (const r of rsvps) {
      rsvpMap[r.activityId.toString()] = r.response;
    }

    const feedbackSet = new Set(feedbacks.map((f) => f.activityId.toString()));

    const upcoming = [];
    const past = [];
    const plan = [];

    for (const act of activities) {
      const isPast = act.date && new Date(act.date) < now && !act.dateToConfirm;
      const userRsvp = rsvpMap[act._id.toString()] || null;
      const formatted = {
        id: act._id.toString(),
        slug: act.slug,
        title: act.title,
        date: act.date,
        dateToConfirm: act.dateToConfirm,
        targetMonth: act.targetMonth,
        startTime: act.startTime,
        endTime: act.endTime,
        venue: act.venue,
        costChoice: act.costChoice,
        userRsvp,
        goingCount: act.goingCount || 0,
        hasFeedback: feedbackSet.has(act._id.toString())
      };

      if (userRsvp === 'going') {
        plan.push(formatted);
      }

      if (isPast) {
        past.push(formatted);
      } else {
        upcoming.push(formatted);
      }
    }

    res.json({ upcoming, past, plan });
  } catch (err) {
    next(err);
  }
});

// 3. Post RSVP
router.post(
  '/rsvp',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(rsvpSchema),
  async (req, res, next) => {
  try {
    const { activityId, response } = req.body;
    const student = req.user;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

    const existing = await Rsvp.findOne({ userId: student._id, activityId });
    if (existing) {
      existing.response = response;
      existing.timestamp = new Date();
      await existing.save();
    } else {
      await Rsvp.create({
        userId: student._id,
        activityId,
        response,
        timestamp: new Date()
      });
    }

    // Recalculate going count and not-going count
    const [goingCount, notGoingCount] = await Promise.all([
      Rsvp.countDocuments({ activityId, response: 'going' }),
      Rsvp.countDocuments({ activityId, response: 'not_going' })
    ]);
    activity.goingCount = goingCount;
    activity.notGoingCount = notGoingCount;
    await activity.save();

    notifyActivityUpdated({
      activityId: activity._id.toString(),
      goingCount,
      notGoingCount,
      studentId: student._id.toString(),
      studentName: student.fullName,
      studentFirstName: student.firstName,
      studentCountry: student.countryCode,
      studentFaculty: student.faculty || '',
      studentEmail: student.email || '',
      response,
      timestamp: new Date()
    });

    res.json({ ok: true, response, goingCount, notGoingCount });
  } catch (err) {
    next(err);
  }
});

// 4. Get specific RSVP
router.get('/rsvp/:activityId', async (req, res, next) => {
  try {
    const rsvp = await Rsvp.findOne({
      userId: req.user._id,
      activityId: req.params.activityId
    }).lean();

    res.json({ response: rsvp?.response || null });
  } catch (err) {
    next(err);
  }
});

// 5. Post Feedback on past activity
router.post(
  '/feedback',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(feedbackSchema),
  async (req, res, next) => {
  try {
    const { activityId, rating } = req.body;
    const student = req.user;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

    const existing = await Feedback.findOne({ userId: student._id, activityId });
    if (existing) {
      existing.rating = rating;
      await existing.save();
    } else {
      await Feedback.create({
        userId: student._id,
        activityId,
        rating
      });
    }

    // Update feedback count on activity
    const count = await Feedback.countDocuments({ activityId });
    activity.feedbackCount = count;
    await activity.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 6. Ask Question (Screen 25)
router.get('/questions', async (req, res, next) => {
  try {
    const questions = await Question.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      questions: questions.map((q) => ({
        id: q._id.toString(),
        topic: q.topic,
        text: q.text,
        status: q.status,
        answer: q.answerText || q.answer || '',
        answeredAt: q.answeredAt,
        createdAt: q.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/questions',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(askQuestionSchema),
  async (req, res, next) => {
  try {
    let { topic, text } = req.body;
    if (topic === 'life') {
      topic = 'life_in_craiova';
    }
    const studentName = req.user.fullName || (req.user.firstName ? `${req.user.firstName}` : 'International Student');
    const question = await Question.create({
      userId: req.user._id,
      studentName,
      topic,
      text,
      status: 'waiting',
      createdAt: new Date()
    });

    res.status(201).json({
      ok: true,
      question: {
        id: question._id.toString(),
        topic: question.topic,
        text: question.text,
        status: question.status,
        studentName: question.studentName,
        createdAt: question.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// 7. Student Wall (Screen 26)
router.get('/wall', async (req, res, next) => {
  try {
    const student = req.user;
    let [currentQuestion, settings] = await Promise.all([
      MonthlyQuestion.findOne({ isPublished: true, isCurrent: true }).lean(),
      SiteSettings.findOne({}).lean()
    ]);
    if (!currentQuestion) {
      currentQuestion = (await MonthlyQuestion.findOne({ isPublished: true }).lean()) || (await MonthlyQuestion.findOne().sort({ createdAt: -1 }).lean());
    }

    const wallUpvoteColor = currentQuestion?.wallUpvoteColor || settings?.wallUpvoteColor || '#1E7B4C';

    let myPost = null;
    let visiblePosts = [];

    if (currentQuestion) {
      [myPost, visiblePosts] = await Promise.all([
        WallPost.findOne({ userId: student._id, questionId: currentQuestion._id }).lean(),
        WallPost.find({ questionId: currentQuestion._id, state: 'visible' })
          .sort({ createdAt: -1 })
          .limit(30)
          .populate('userId', 'firstName countryCode')
          .lean()
      ]);
    }

    res.json({
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion._id.toString(),
            month: currentQuestion.month,
            question: currentQuestion.question,
            isOpen: currentQuestion.isOpen,
            wallUpvoteColor: currentQuestion.wallUpvoteColor || wallUpvoteColor,
            createdAt: currentQuestion.createdAt,
            updatedAt: currentQuestion.updatedAt
          }
        : null,
      wallUpvoteColor,
      myPost: myPost
        ? {
            id: myPost._id.toString(),
            text: myPost.text,
            state: myPost.state,
            meTooCount: myPost.meTooCount || 0,
            createdAt: myPost.createdAt
          }
        : null,
      visiblePosts: visiblePosts
        .filter((p) => p.userId)
        .map((p) => ({
          id: p._id.toString(),
          text: p.text,
          meTooCount: p.meTooCount || 0,
          createdAt: p.createdAt,
          user: {
            firstName: p.userId.firstName,
            countryName: getCountryName(p.userId.countryCode)
          }
        }))
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/wall/posts',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(wallPostSchema),
  async (req, res, next) => {
  try {
    const { text } = req.body;
    const student = req.user;

    let currentQuestion = await MonthlyQuestion.findOne({ isPublished: true, isCurrent: true });
    if (!currentQuestion) {
      currentQuestion = (await MonthlyQuestion.findOne({ isPublished: true })) || (await MonthlyQuestion.findOne().sort({ createdAt: -1 }));
    }
    if (!currentQuestion) {
      currentQuestion = await MonthlyQuestion.create({
        month: 'October',
        question: 'What do you hope to discover in Romania?',
        isPublished: true,
        isCurrent: true,
        isOpen: true
      });
    }

    const existing = await WallPost.findOne({ userId: student._id, questionId: currentQuestion._id });
    if (existing) {
      existing.text = text;
      existing.state = 'visible';
      existing.removedBy = null;
      existing.removedAt = null;
      await existing.save();
      notifyWallUpdated({ action: 'update', postId: existing._id, post: existing });
      return res.status(200).json({
        ok: true,
        post: {
          id: existing._id.toString(),
          text: existing.text,
          state: existing.state,
          createdAt: existing.createdAt
        },
        updated: true
      });
    }

    const post = await WallPost.create({
      userId: student._id,
      questionId: currentQuestion._id,
      text,
      state: 'visible',
      meTooCount: 0,
      createdAt: new Date()
    });

    notifyWallUpdated({ action: 'create', postId: post._id, post });

    res.status(201).json({
      ok: true,
      post: {
        id: post._id.toString(),
        text: post.text,
        state: post.state,
        createdAt: post.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/wall/posts/:id',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(wallPostSchema),
  async (req, res, next) => {
  try {
    const post = await WallPost.findOne({ _id: req.params.id, userId: req.user._id });
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found or unauthorized.' } });
    }

    post.text = req.body.text;
    post.state = 'visible';
    post.removedBy = null;
    post.removedAt = null;
    await post.save();

    notifyWallUpdated({ action: 'update', postId: post._id, post });

    res.json({
      ok: true,
      post: {
        id: post._id.toString(),
        text: post.text,
        state: post.state,
        createdAt: post.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/wall/posts/:id', async (req, res, next) => {
  try {
    const post = await WallPost.findOne({ _id: req.params.id, userId: req.user._id });
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found or unauthorized.' } });
    }

    await WallPost.deleteOne({ _id: post._id });
    await MeToo.deleteMany({ wallPostId: post._id });
    notifyWallUpdated({ action: 'delete', postId: post._id });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 8. Learn a Word (Screen 27)
router.get('/words', async (req, res, next) => {
  try {
    const student = req.user;
    const [wordOfTheMonth, phrases, mySharedWords, otherSharedWords] = await Promise.all([
      WordOfTheMonth.findOne({ isPublished: true, isCurrent: true }).lean(),
      Phrase.find({ isPublished: true }).sort({ order: 1 }).lean(),
      SharedWord.find({ userId: student._id }).sort({ createdAt: -1 }).lean(),
      SharedWord.find({ userId: { $ne: student._id }, state: 'visible' })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'firstName')
        .lean()
    ]);

    res.json({
      wordOfTheMonth,
      phrases,
      mySharedWords: mySharedWords.map((w) => ({
        id: w._id.toString(),
        word: w.word,
        language: w.language,
        meaning: w.meaning,
        createdAt: w.createdAt
      })),
      otherSharedWords: otherSharedWords
        .filter((w) => w.userId)
        .map((w) => ({
          id: w._id.toString(),
          word: w.word,
          language: w.language,
          meaning: w.meaning,
          sharedBy: w.userId.firstName
        }))
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/words',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(shareWordSchema),
  async (req, res, next) => {
  try {
    const { word, language, meaning } = req.body;
    const shared = await SharedWord.create({
      userId: req.user._id,
      word,
      language,
      meaning,
      state: 'visible',
      createdAt: new Date()
    });

    res.status(201).json({
      ok: true,
      sharedWord: {
        id: shared._id.toString(),
        word: shared.word,
        language: shared.language,
        meaning: shared.meaning,
        createdAt: shared.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/words/:id', async (req, res, next) => {
  try {
    const word = await SharedWord.findOne({ _id: req.params.id, userId: req.user._id });
    if (!word) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Word not found or unauthorized.' } });
    }

    await SharedWord.deleteOne({ _id: word._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// 9. Student Clubs (Screen 28)
router.get('/clubs', async (req, res, next) => {
  try {
    const student = req.user;
    const [openClubs, memberships, myProposals, clubAreas, myUpvotes] = await Promise.all([
      Club.find({ status: 'published' }).sort({ createdAt: -1 }).lean(),
      ClubMembership.find({ userId: student._id }).lean(),
      ClubProposal.find({ userId: student._id }).sort({ createdAt: -1 }).lean(),
      ClubArea.find({ isPublished: true }).sort({ order: 1 }).lean(),
      ClubUpvote.find({ voterKey: student._id.toString() }).lean()
    ]);

    const joinedSet = new Set(memberships.map((m) => m.clubId.toString()));
    const upvotedSet = new Set(myUpvotes.map((u) => u.clubAreaId.toString()));

    res.json({
      openClubs: openClubs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        motto: c.motto,
        description: c.description,
        frequency: c.frequency,
        whatsappUrl: c.whatsappUrl || '',
        memberCount: c.memberCount || 0,
        isMember: joinedSet.has(c._id.toString())
      })),
      myProposals: myProposals.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        idea: p.idea,
        status: p.status,
        createdAt: p.createdAt
      })),
      clubAreas: clubAreas.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        description: a.description,
        upvoteCount: a.upvoteCount || 0,
        isUpvoted: upvotedSet.has(a._id.toString())
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/clubs/proposals',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(proposeClubSchema),
  async (req, res, next) => {
  try {
    const { name, idea, wantsToHelp } = req.body;
    const proposal = await ClubProposal.create({
      userId: req.user._id,
      name,
      idea,
      wantsToHelp: Boolean(wantsToHelp),
      status: 'received',
      createdAt: new Date()
    });

    res.status(201).json({
      ok: true,
      proposal: {
        id: proposal._id.toString(),
        name: proposal.name,
        status: proposal.status,
        createdAt: proposal.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/clubs/:id/join', async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Club not found.' } });
    }

    const existing = await ClubMembership.findOne({ userId: req.user._id, clubId: club._id });
    if (!existing) {
      await ClubMembership.create({
        userId: req.user._id,
        clubId: club._id,
        joinedAt: new Date()
      });
    }

    club.memberCount = await ClubMembership.countDocuments({ clubId: club._id });
    await club.save();

    res.json({ ok: true, memberCount: club.memberCount });
  } catch (err) {
    next(err);
  }
});

router.post('/clubs/:id/leave', async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Club not found.' } });
    }

    await ClubMembership.deleteMany({ userId: req.user._id, clubId: club._id });
    club.memberCount = await ClubMembership.countDocuments({ clubId: club._id });
    await club.save();

    res.json({ ok: true, memberCount: club.memberCount });
  } catch (err) {
    next(err);
  }
});

// 10. Ambassadors Portal (Screen 29)
router.get('/ambassadors', async (req, res, next) => {
  try {
    const student = req.user;
    const [app, settings] = await Promise.all([
      AmbassadorApplication.findOne({ userId: student._id }).lean(),
      SiteSettings.findOne({}).lean()
    ]);

    const isApprovedAmbassador = Boolean(
      student.isAmbassador || (app && (app.status === 'approved' || app.status === 'accepted'))
    );

    res.json({
      application: app
        ? {
            id: app._id.toString(),
            status: app.status,
            why: app.why,
            hoursPerMonth: app.hoursPerMonth,
            createdAt: app.createdAt
          }
        : null,
      isAmbassador: isApprovedAmbassador,
      loggedHours: student.ambassadorHoursLogged || 0,
      volunteeringHistory: student.ambassadorHistory || [],
      requiredHoursForCertificate: settings?.certificateHours || 20,
      certificateLine: settings?.certificateLine || 'Official volunteering certificate from the University of Craiova'
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/ambassadors/apply',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(applyAmbassadorSchema),
  async (req, res, next) => {
  try {
    const { why, languages, hoursPerMonth } = req.body;
    const student = req.user;

    let application = await AmbassadorApplication.findOne({ userId: student._id });
    if (application && (application.status === 'pending' || application.status === 'applied' || application.status === 'approved' || application.status === 'accepted')) {
      return res.status(400).json({ error: { code: 'ALREADY_APPLIED', message: 'You have already submitted an ambassador application.' } });
    }

    if (application) {
      application.why = why;
      application.languages = languages;
      application.hoursPerMonth = hoursPerMonth;
      application.status = 'pending';
      application.createdAt = new Date();
      await application.save();
    } else {
      application = await AmbassadorApplication.create({
        userId: student._id,
        why,
        languages,
        hoursPerMonth,
        status: 'pending',
        createdAt: new Date()
      });
    }

    res.status(201).json({
      ok: true,
      application: {
        id: application._id.toString(),
        status: application.status,
        why: application.why,
        languages: application.languages,
        hoursPerMonth: application.hoursPerMonth,
        createdAt: application.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// 11. Profile Update (Screen 30)
router.get('/profile', async (req, res) => {
  const student = req.user;
  res.json({
    id: student._id.toString(),
    fullName: student.fullName,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    mobile: student.mobile || '',
    countryCode: student.countryCode,
    countryName: getCountryName(student.countryCode),
    programme: student.programme,
    faculty: student.faculty,
    notificationPrefs: student.notificationPrefs || {
      newActivities: true,
      questionAnswers: true,
      communityUpdates: true
    }
  });
});

router.patch(
  '/profile',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip
  }),
  validate(updateProfileSchema),
  async (req, res, next) => {
  try {
    const { mobile, faculty, programme, notificationPrefs } = req.body;
    const student = req.user;

    if (mobile !== undefined) student.mobile = mobile;
    if (faculty !== undefined) student.faculty = faculty.trim();
    if (programme !== undefined) student.programme = programme.trim();
    if (notificationPrefs !== undefined) {
      student.notificationPrefs = {
        ...student.notificationPrefs,
        ...notificationPrefs
      };
    }

    await student.save();
    res.json({
      ok: true,
      mobile: student.mobile,
      faculty: student.faculty,
      programme: student.programme,
      notificationPrefs: student.notificationPrefs
    });
  } catch (err) {
    next(err);
  }
});

// 12. Notifications
router.get('/notifications', async (req, res, next) => {
  try {
    const list = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      notifications: list.map((n) => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        link: n.link || '',
        read: n.read,
        createdAt: n.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/read', async (req, res, next) => {
  try {
    const { notificationId } = req.body;
    if (notificationId) {
      await Notification.updateOne({ _id: notificationId, userId: req.user._id }, { read: true });
    } else {
      await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
