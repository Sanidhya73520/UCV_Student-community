import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { ClubArea } from '../models/ClubArea.js';
import { WordOfTheMonth } from '../models/WordOfTheMonth.js';
import { Phrase } from '../models/Phrase.js';
import { MonthlyQuestion } from '../models/MonthlyQuestion.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { WallPost } from '../models/WallPost.js';
import { Question } from '../models/Question.js';
import { ClubProposal } from '../models/ClubProposal.js';
import { AmbassadorApplication } from '../models/AmbassadorApplication.js';
import { Rsvp } from '../models/Rsvp.js';
import { SharedWord } from '../models/SharedWord.js';
import { env } from '../config/env.js';
import dotenv from 'dotenv';

export async function ensureInitialData() {
  try {
    const PERMANENT_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const PERMANENT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const adminEmail = PERMANENT_ADMIN_EMAIL;
    const adminName = process.env.ADMIN_NAME;
    const adminPassword = PERMANENT_ADMIN_PASSWORD;

    // 1. Permanent data retention: Do NOT purge any users or collections on restart

    // 2. Ensure only the permanent admin has isPermanentAdmin: true
    await User.updateMany(
      { email: { $ne: PERMANENT_ADMIN_EMAIL } },
      { isPermanentAdmin: false }
    );

    // Ensure ONLY the permanent admin user exists
    let admin = await User.findOne({ email: PERMANENT_ADMIN_EMAIL });
    const passwordHash = await bcrypt.hash(PERMANENT_ADMIN_PASSWORD, 12);

    if (!admin) {
      admin = new User({
        fullName: adminName,
        firstName: adminName.split(' ')[0],
        email: PERMANENT_ADMIN_EMAIL,
        passwordHash,
        temporaryPasswordHash: null,
        tempPasswordExpiresAt: null,
        mustChangePassword: false,
        role: 'admin',
        status: 'active',
        joinSource: 'invitation',
        isPermanentAdmin: true,
        countryCode: 'RO',
        consentDate: new Date()
      });
      await admin.save();
      console.log(`[SEED] Created sole permanent admin on Atlas: ${PERMANENT_ADMIN_EMAIL}`);
    } else {
      admin.role = 'admin';
      admin.status = 'active';
      admin.isPermanentAdmin = true;
      admin.passwordHash = passwordHash;
      admin.temporaryPasswordHash = null;
      admin.tempPasswordExpiresAt = null;
      admin.mustChangePassword = false;
      await admin.save();
      console.log(`[SEED] Verified sole permanent admin on Atlas: ${PERMANENT_ADMIN_EMAIL}`);
    }

    // 3. Ensure baseline site settings
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({
        welcomeLine: 'Welcome to the University of Craiova',
        headline: 'Meet. Connect. Belong.',
        subline: 'This is your community. Find your people and make Craiova feel like home.',
        officeEmail: 'international@ucv.ro',
        officeHours: 'Monday to Friday, 10:00 - 14:00',
        whereToFindUs: 'Main Building, Room 102',
        officialInfoUrl: 'https://www.ucv.ro',
        isPublished: true,
        ambassadorOpen: true
      });
      await settings.save();
    }

    // 4. Ensure active monthly question
    let question = await MonthlyQuestion.findOne({ isCurrent: true });
    if (!question) {
      await MonthlyQuestion.create({
        month: 'October',
        question: 'What do you hope to discover in Romania?',
        isPublished: true,
        isCurrent: true,
        isOpen: true
      });
      console.log('[SEED] Created baseline active monthly question');
    }

    // 5. Ensure active word of the month
    let word = await WordOfTheMonth.findOne({ isCurrent: true });
    if (!word) {
      word = new WordOfTheMonth();
    }
    word.month = 'October';
    word.word = 'dor';
    word.meaning = 'A deep longing for someone or something you love, often home. Romanians say it has no exact translation.';
    word.pronunciation = 'Say it like "door", with a rolled r';
    word.exampleRo = 'Mi-e dor de casă.';
    word.exampleEn = 'I miss home.';
    word.challenge = 'Use "dor" once this week with a Romanian friend, and see if they notice.';
    word.isPublished = true;
    word.isCurrent = true;
    await word.save();
    console.log('[SEED] Ensured active word of the month: dor');

    // 5b. Ensure 6 baseline everyday Romanian phrases
    await Phrase.deleteMany({ romanian: 'multumesc' });
    const BASELINE_PHRASES = [
      { romanian: 'Bună', pronunciation: 'BOO-nuh', english: 'Hi', order: 1 },
      { romanian: 'Mulțumesc', pronunciation: 'mool-tsoo-MESK', english: 'Thank you', order: 2 },
      { romanian: 'Noroc', pronunciation: 'no-ROK', english: 'Cheers / Good luck', order: 3 },
      { romanian: 'Poftă bună', pronunciation: 'POF-tuh BOO-nuh', english: 'Enjoy your meal', order: 4 },
      { romanian: 'Pe curând', pronunciation: 'peh koo-RUHND', english: 'See you soon', order: 5 },
      { romanian: 'Nu înțeleg', pronunciation: 'noo uhn-tseh-LEG', english: "I don't understand", order: 6 }
    ];
    for (const bp of BASELINE_PHRASES) {
      const existing = await Phrase.findOne({ romanian: new RegExp(`^${bp.romanian}$`, 'i') });
      if (!existing) {
        await Phrase.create({ ...bp, isPublished: true });
      } else {
        existing.romanian = bp.romanian;
        existing.pronunciation = bp.pronunciation;
        existing.english = bp.english;
        existing.order = bp.order;
        existing.isPublished = true;
        await existing.save();
      }
    }
    console.log('[SEED] Ensured 6 baseline everyday Romanian phrases');

    // 5c. Shared member words: student users are created dynamically through real registrations


    // 6. Ensure baseline interest areas if collection is empty
    const areaCount = await ClubArea.countDocuments();
    if (areaCount === 0) {
      const BASELINE_AREAS = [
        { name: 'Sports and fitness', description: 'Running, gym sessions, football, badminton, and staying active together.' },
        { name: 'Music / Dance', description: 'Jam sessions, dance choreography, sharing playlists, and live performances.' },
        { name: 'Art and drawing', description: 'Sketching, watercolor, digital art, creative crafts, and gallery visits.' },
        { name: 'Photography and video', description: 'Photo walks across Craiova, mobile photography, and video storytelling.' },
        { name: 'Board games and card games', description: 'Strategy games, Catan, chess, card games, and social game nights.' },
        { name: 'Movies and series', description: 'Watch parties, cinema outings, favorite show discussions, and film critiques.' },
        { name: 'Reading/Writing/Literature', description: 'Book swaps, creative writing, poetry sessions, and cozy reading circles.' },
        { name: 'Travel and day trips', description: 'Exploring Oltenia, weekend castle trips, hiking trails, and Romanian landmarks.' },
        { name: 'Tech and coding', description: 'Collaborative projects, hackathons, AI discussions, and peer coding workshops.' },
        { name: 'Entrepreneurship', description: 'Startup brainstorming, business models, pitching practice, and networking.' },
        { name: 'Debates and discussions', description: 'Open dialogues on current events, philosophy, and public speaking practice.' },
        { name: 'Volunteering', description: 'Community support, local causes, animal shelter care, and environmental cleanups.' },
        { name: 'Yoga and wellbeing', description: 'Mindfulness, morning yoga flows, stress relief, meditation, and mental wellbeing.' }
      ];
      for (let i = 0; i < BASELINE_AREAS.length; i++) {
        await ClubArea.create({
          ...BASELINE_AREAS[i],
          order: i,
          isPublished: true,
          upvoteCount: 0
        });
      }
      console.log('[SEED] Created baseline 13 interest areas.');
    }

    // 7. Ensure student names are associated and saved with all coordinator questions
    const unassociatedQuestions = await Question.find({
      $or: [{ studentName: null }, { studentName: { $exists: false } }]
    }).populate('userId', 'fullName firstName');

    for (const q of unassociatedQuestions) {
      let name = null;
      if (q.userId && typeof q.userId === 'object' && (q.userId.fullName || q.userId.firstName)) {
        name = q.userId.fullName || q.userId.firstName;
      } else if (q.userId) {
        const u = await User.findById(q.userId).select('fullName firstName').lean();
        if (u) name = u.fullName || u.firstName;
      }
      if (!name) {
        name = 'International Student';
      }
      await Question.updateOne({ _id: q._id }, { $set: { studentName: name } });
    }

    // Ensure at least one open question for staff dashboard display if all were answered
    const waitingQuestionsCount = await Question.countDocuments({ status: { $in: ['waiting', 'pending'] } });
    if (waitingQuestionsCount === 0) {
      let student = await User.findOne({ role: 'student', status: 'approved' });
      if (!student) student = await User.findOne({ role: 'student' });
      if (student) {
        await Question.create({
          userId: student._id,
          studentName: student.fullName || student.firstName || 'Lucía García',
          topic: 'events',
          text: 'Do we need to bring anything specific to the welcome evening?',
          status: 'waiting',
          createdAt: new Date()
        });
        console.log(`[SEED] Ensured open question for student: ${student.fullName}`);
      }
    }

    console.log('[SEED] Database ready on Atlas: baseline config, student questions, and admin present.');
  } catch (err) {
    console.error('[SEED] Warning: error ensuring initial data:', err.message);
  }
}
