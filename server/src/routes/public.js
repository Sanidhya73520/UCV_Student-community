import { Router } from 'express';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { ClubArea } from '../models/ClubArea.js';
import { ClubUpvote } from '../models/ClubUpvote.js';
import { Club } from '../models/Club.js';
import { MonthlyQuestion } from '../models/MonthlyQuestion.js';
import { WallPost } from '../models/WallPost.js';
import { MeToo } from '../models/MeToo.js';
import { WordOfTheMonth } from '../models/WordOfTheMonth.js';
import { Phrase } from '../models/Phrase.js';
import { SharedWord } from '../models/SharedWord.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { getCountryName } from '../../../shared/countries.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { getMapPayload, handleMapStream } from '../services/mapBroadcaster.js';
import { handleWallStream, notifyWallUpdated } from '../services/wallBroadcaster.js';
import { env } from '../config/env.js';

const router = Router();

// Cache headers helper
function setPublicCache(res) {
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
}

// VoterKey cookie helper for anonymous upvotes & Me Too
function getOrSetVoterKey(req, res) {
  let key = req.cookies?.voterKey;
  if (!key) {
    key = crypto.randomBytes(16).toString('hex');
    res.cookie('voterKey', key, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/'
    });
  }
  return req.user ? req.user._id.toString() : key;
}

// 1. Home Data
router.get('/home', async (req, res, next) => {
  try {
    setPublicCache(res);

    const [settings, clubAreas, upcomingActivities] = await Promise.all([
      SiteSettings.findOne({}).lean(),
      ClubArea.find({ isPublished: true }).sort({ order: 1 }).lean(),
      Activity.find({ status: 'published' })
        .sort({ date: 1, createdAt: 1 })
        .limit(3)
        .lean()
    ]);

    res.json({
      settings: settings || {},
      clubAreas: clubAreas.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        description: a.description,
        upvoteCount: a.upvoteCount || 0
      })),
      upcomingActivities: upcomingActivities.map((act) => ({
        id: act._id.toString(),
        slug: act.slug,
        title: act.title,
        date: act.date,
        dateToConfirm: act.dateToConfirm,
        targetMonth: act.targetMonth,
        startTime: act.startTime,
        endTime: act.endTime,
        venue: act.venue,
        description: act.description,
        costChoice: act.costChoice
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 2. Map Data (Real-time and SSE Stream)
router.get('/map', async (req, res, next) => {
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

router.get('/map/stream', (req, res) => {
  handleMapStream(req, res);
});

// 3. Shape Our Clubs
router.get('/clubs', async (req, res, next) => {
  try {
    setPublicCache(res);

    const [clubAreas, openClubs] = await Promise.all([
      ClubArea.find({ isPublished: true }).sort({ order: 1 }).lean(),
      Club.find({ status: 'published' }).sort({ createdAt: -1 }).lean()
    ]);

    res.json({
      clubAreas: clubAreas.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        description: a.description,
        upvoteCount: a.upvoteCount || 0
      })),
      openClubs: openClubs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        motto: c.motto,
        description: c.description,
        frequency: c.frequency,
        memberCount: c.memberCount || 0
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 4. Activity Calendar
router.get('/activities', async (req, res, next) => {
  try {
    setPublicCache(res);

    const activities = await Activity.find({ status: 'published' })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const now = new Date();
    const upcoming = [];
    const earlier = [];

    for (const act of activities) {
      const isPast = act.date && new Date(act.date) < now && !act.dateToConfirm;
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
        description: act.description
      };

      if (isPast) {
        earlier.push(formatted);
      } else {
        upcoming.push(formatted);
      }
    }

    res.json({ upcoming, earlier });
  } catch (err) {
    next(err);
  }
});

// 5. Activity Details
router.get('/activities/:slug', async (req, res, next) => {
  try {
    setPublicCache(res);

    const activity = await Activity.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!activity) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Activity not found.' } });
    }

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
        itinerary: activity.itinerary || [],
        whatToBring: activity.whatToBring || [],
        goodToKnow: activity.goodToKnow || [],
        goingCount: activity.goingCount || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

// 6. International Wall Stream (SSE)
router.get('/wall/stream', handleWallStream);

// 6.1 International Wall
router.get('/wall', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

    const [currentQuestion, allQuestions, settings] = await Promise.all([
      MonthlyQuestion.findOne({ isPublished: true, isCurrent: true }).lean(),
      MonthlyQuestion.find({ isPublished: true }).sort({ createdAt: 1 }).lean(),
      SiteSettings.findOne({}).lean()
    ]);

    const wallUpvoteColor = currentQuestion?.wallUpvoteColor || settings?.wallUpvoteColor || '#1E7B4C';

    let answers = [];
    if (currentQuestion) {
      const posts = await WallPost.find({ questionId: currentQuestion._id, state: 'visible' })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('userId', 'firstName countryCode')
        .lean();

      answers = posts
        .filter((p) => p.userId)
        .map((p) => ({
          id: p._id.toString(),
          text: p.text,
          meTooCount: p.meTooCount || 0,
          createdAt: p.createdAt,
          user: {
            firstName: p.userId.firstName,
            countryCode: p.userId.countryCode,
            countryName: getCountryName(p.userId.countryCode)
          }
        }));
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
      answers,
      allQuestions: allQuestions.map((q) => ({
        id: q._id.toString(),
        month: q.month,
        question: q.question,
        status: q.isCurrent ? 'Now open' : q.isOpen ? 'Coming soon' : 'Closed',
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 7. Learn a Word
router.get('/words', async (req, res, next) => {
  try {
    setPublicCache(res);

    const [wordOfMonth, phrases, sharedWords] = await Promise.all([
      WordOfTheMonth.findOne({ isPublished: true, isCurrent: true }).lean(),
      Phrase.find({ isPublished: true }).sort({ order: 1 }).lean(),
      SharedWord.find({ state: 'visible' })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('userId', 'firstName countryCode')
        .lean()
    ]);

    res.json({
      wordOfTheMonth: wordOfMonth
        ? {
            id: wordOfMonth._id.toString(),
            month: wordOfMonth.month,
            word: wordOfMonth.word,
            pronunciation: wordOfMonth.pronunciation,
            meaning: wordOfMonth.meaning,
            exampleRo: wordOfMonth.exampleRo,
            exampleEn: wordOfMonth.exampleEn,
            challenge: wordOfMonth.challenge
          }
        : null,
      phrases: phrases.map((p) => ({
        id: p._id.toString(),
        romanian: p.romanian,
        pronunciation: p.pronunciation,
        english: p.english
      })),
      sharedWords: sharedWords
        .filter((w) => w.userId)
        .map((w) => ({
          id: w._id.toString(),
          word: w.word,
          language: w.language,
          meaning: w.meaning,
          sharedBy: w.userId.firstName,
          countryCode: w.userId.countryCode,
          countryName: getCountryName(w.userId.countryCode) || ''
        }))
    });
  } catch (err) {
    next(err);
  }
});

// 8. Ambassadors Info
router.get('/ambassadors', async (req, res, next) => {
  try {
    setPublicCache(res);
    const settings = (await SiteSettings.findOne({}).lean()) || {};

    res.json({
      isOpen: settings.ambassadorOpen ?? true,
      numberWanted: settings.ambassadorNumberWanted || '10 to 15',
      applyByDate: settings.ambassadorApplyByDate || '15 November 2026',
      firstMeeting: settings.ambassadorFirstMeeting || 'Wednesday 18 November 2026, 16:00, IR Office',
      certificateLine: settings.certificateLine || 'Official volunteering certificate from the University of Craiova'
    });
  } catch (err) {
    next(err);
  }
});

// 9. Privacy Notice
router.get('/privacy', async (req, res, next) => {
  try {
    setPublicCache(res);
    const settings = await SiteSettings.findOne({}).lean();
    res.json({
      privacyNotice: settings?.privacyNotice || 'Privacy notice to be confirmed by the IR Office.'
    });
  } catch (err) {
    next(err);
  }
});

// 10. Toggle Upvote on Club Area
router.post(
  '/upvotes/toggle',
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.cookies?.voterKey || req.ip
  }),
  async (req, res, next) => {
    try {
      const { clubAreaId } = req.body;
      if (!clubAreaId) {
        return res.status(400).json({ error: { code: 'MISSING_ID', message: 'Club area ID is required.' } });
      }

      const voterKey = getOrSetVoterKey(req, res);
      const existing = await ClubUpvote.findOne({ clubAreaId, voterKey });

      let upvoted = false;
      let diff = 0;

      if (existing) {
        await ClubUpvote.deleteOne({ _id: existing._id });
        diff = -1;
        upvoted = false;
      } else {
        await ClubUpvote.create({ clubAreaId, voterKey });
        diff = 1;
        upvoted = true;
      }

      const updatedArea = await ClubArea.findByIdAndUpdate(
        clubAreaId,
        { $inc: { upvoteCount: diff } },
        { new: true }
      );

      res.json({
        upvoted,
        upvoteCount: Math.max(0, updatedArea?.upvoteCount || 0)
      });
    } catch (err) {
      next(err);
    }
  }
);

// 11. Toggle Me Too on Wall Post
router.post(
  '/me-too/toggle',
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.cookies?.voterKey || req.ip
  }),
  async (req, res, next) => {
    try {
      const { wallPostId } = req.body;
      if (!wallPostId) {
        return res.status(400).json({ error: { code: 'MISSING_ID', message: 'Wall post ID is required.' } });
      }

      const voterKey = getOrSetVoterKey(req, res);
      const existing = await MeToo.findOne({ wallPostId, voterKey });

      let meToo = false;
      let diff = 0;

      if (existing) {
        await MeToo.deleteOne({ _id: existing._id });
        diff = -1;
        meToo = false;
      } else {
        await MeToo.create({ wallPostId, voterKey });
        diff = 1;
        meToo = true;
      }

      const updatedPost = await WallPost.findByIdAndUpdate(
        wallPostId,
        { $inc: { meTooCount: diff } },
        { new: true }
      );

      const currentMeTooCount = Math.max(0, updatedPost?.meTooCount || 0);

      notifyWallUpdated({
        action: 'meToo',
        postId: wallPostId,
        meTooCount: currentMeTooCount
      });

      res.json({
        meToo,
        meTooCount: currentMeTooCount
      });
    } catch (err) {
      next(err);
    }
  }
);

// 12. Voter's current selections
router.get('/votes/mine', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const voterKey = req.user ? req.user._id.toString() : req.cookies?.voterKey;

    if (!voterKey) {
      return res.json({ upvotedAreaIds: [], meTooPostIds: [] });
    }

    const [upvotes, meToos] = await Promise.all([
      ClubUpvote.find({ voterKey }).select('clubAreaId').lean(),
      MeToo.find({ voterKey }).select('wallPostId').lean()
    ]);

    res.json({
      upvotedAreaIds: upvotes.map((u) => u.clubAreaId.toString()),
      meTooPostIds: meToos.map((m) => m.wallPostId.toString())
    });
  } catch (err) {
    next(err);
  }
});

export default router;
