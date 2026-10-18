import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/db/connect.js';
import { User } from '../src/models/User.js';
import { Activity } from '../src/models/Activity.js';
import { Rsvp } from '../src/models/Rsvp.js';
import { WallPost } from '../src/models/WallPost.js';
import { SharedWord } from '../src/models/SharedWord.js';
import { Question } from '../src/models/Question.js';
import { MonthlyQuestion } from '../src/models/MonthlyQuestion.js';
import { ClubProposal } from '../src/models/ClubProposal.js';
import { AmbassadorApplication } from '../src/models/AmbassadorApplication.js';
import { env } from '../src/config/env.js';

async function seedDemo() {
  if (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
    console.error('FATAL: Refusing to seed demo data in production environment!');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('Connected to database for demo seeding.');

    const defaultPasswordHash = await bcrypt.hash('StudentPass123!', 12);

    const demoStudents = [
      {
        fullName: 'Lucía García',
        firstName: 'Lucía',
        email: 'lucia.garcia@example.com',
        passwordHash: defaultPasswordHash,
        mobile: '+34 612 345 678',
        countryCode: 'ES',
        faculty: 'Letters',
        programme: 'erasmus_exchange',
        role: 'student',
        status: 'approved',
        consentDate: new Date(),
        approvedAt: new Date()
      },
      {
        fullName: 'Mateo Rossi',
        firstName: 'Mateo',
        email: 'mateo.rossi@example.com',
        passwordHash: defaultPasswordHash,
        mobile: '+39 345 678 9012',
        countryCode: 'IT',
        faculty: 'Sciences',
        programme: 'erasmus_exchange',
        role: 'student',
        status: 'approved',
        consentDate: new Date(),
        approvedAt: new Date()
      },
      {
        fullName: 'Camille Dubois',
        firstName: 'Camille',
        email: 'camille.dubois@example.com',
        passwordHash: defaultPasswordHash,
        mobile: '+33 612 345 678',
        countryCode: 'FR',
        faculty: 'Economics',
        programme: 'full_degree',
        role: 'student',
        status: 'approved',
        consentDate: new Date(),
        approvedAt: new Date()
      },
      {
        fullName: 'Yılmaz Demir',
        firstName: 'Yılmaz',
        email: 'yilmaz.demir@example.com',
        passwordHash: defaultPasswordHash,
        mobile: '+90 532 123 4567',
        countryCode: 'TR',
        faculty: 'Engineering',
        programme: 'erasmus_traineeship',
        role: 'student',
        status: 'waiting', // Pending approval for testing!
        consentDate: new Date()
      }
    ];

    const createdUsers = [];
    for (const student of demoStudents) {
      const u = await User.findOneAndUpdate({ email: student.email }, student, { upsert: true, new: true });
      createdUsers.push(u);
    }
    console.log(`Seeded ${createdUsers.length} demo students.`);

    // Welcome evening RSVP
    const welcome = await Activity.findOne({ slug: 'welcome-evening' });
    if (welcome) {
      await Rsvp.findOneAndUpdate(
        { activityId: welcome._id, userId: createdUsers[0]._id },
        { activityId: welcome._id, userId: createdUsers[0]._id, response: 'going' },
        { upsert: true }
      );
      await Activity.findByIdAndUpdate(welcome._id, { $inc: { goingCount: 1 } });
    }

    // Wall answers
    const octQuestion = await MonthlyQuestion.findOne({ month: 'October 2026' });
    if (octQuestion) {
      await WallPost.create({
        questionId: octQuestion._id,
        userId: createdUsers[0]._id,
        text: 'I hope to discover Romanian castles and make friends from everywhere!'
      });
      await WallPost.create({
        questionId: octQuestion._id,
        userId: createdUsers[1]._id,
        text: 'Looking forward to trying sarmale and travelling to the mountains.'
      });
    }

    // Shared words
    await SharedWord.create({
      userId: createdUsers[0]._id,
      word: 'Sobremesa',
      language: 'Spanish',
      meaning: 'The time spent lingering around the table after a meal, talking with friends.'
    });

    await SharedWord.create({
      userId: createdUsers[2]._id,
      word: 'Retrouvailles',
      language: 'French',
      meaning: 'The joy of reuniting with someone after a long separation.'
    });

    // Question to coordinator
    await Question.create({
      userId: createdUsers[0]._id,
      topic: 'events',
      text: 'Do we need to bring anything specific to the welcome evening?'
    });

    // Club proposal
    await ClubProposal.create({
      userId: createdUsers[1]._id,
      name: 'Board games night',
      idea: 'Meet every other Thursday to play strategy and party board games.',
      wantsToHelp: true,
      status: 'received'
    });

    // Ambassador application
    await AmbassadorApplication.create({
      userId: createdUsers[0]._id,
      why: 'I love welcoming newcomers and helping students settle down in Craiova.',
      languages: 'Spanish, English',
      hoursPerMonth: '4_to_8',
      status: 'applied'
    });

    console.log('Demo content seeded successfully.');
    await disconnectDB();
  } catch (err) {
    console.error('Failed to seed demo data:', err);
    process.exit(1);
  }
}

seedDemo();
