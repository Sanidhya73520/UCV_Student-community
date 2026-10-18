import { connectDB, disconnectDB } from '../src/db/connect.js';
import { Activity } from '../src/models/Activity.js';
import { ClubArea } from '../src/models/ClubArea.js';
import { WordOfTheMonth } from '../src/models/WordOfTheMonth.js';
import { Phrase } from '../src/models/Phrase.js';
import { MonthlyQuestion } from '../src/models/MonthlyQuestion.js';
import { SiteSettings } from '../src/models/SiteSettings.js';

async function seedContent() {
  try {
    await connectDB();
    console.log('Connected to database for content seeding.');

    // 1. Welcome Evening Activity
    const welcomeActivity = {
      slug: 'welcome-evening',
      title: 'Welcome evening',
      status: 'published',
      dateToConfirm: false,
      targetMonth: 'October',
      date: new Date('2026-10-21T14:00:00.000Z'), // Wednesday 21 October 2026, 17:00 Romanian Time (UTC+3)
      startTime: '17:00',
      endTime: '19:00',
      venue: '[Venue]',
      description: 'Meet the international community, discover the clubs and start your year in Craiova with new friends.',
      costChoice: 'free',
      askIfGoing: true,
      quote: "The most important thing isn't in the welcome bag. It's the people you're about to meet.",
      quoteSource: 'From your welcome card',
      whatToBring: [
        'Your phone, to join the community on the spot',
        'A friend who is new in Craiova',
        'Optional: something small from home to show others'
      ],
      goodToKnow: [
        'Open to all international students; Romanian students are welcome too',
        'The evening is in English',
        'Questions? Write to international@ucv.ro'
      ],
      itinerary: [
        { time: '17:00', title: 'Arrival, welcome bags and name tags', detail: 'Say hello and collect your welcome bag' },
        { time: '17:15', title: 'Welcome from the International Relations Office', detail: 'A short hello from the team' },
        { time: '17:30', title: 'Find your people', detail: 'Icebreaker bingo to meet students from other countries' },
        { time: '18:00', title: 'Where are we from?', detail: 'Add your country to the community map' },
        { time: '18:20', title: 'Teach me something', detail: 'Learn a word, a gesture or a game from someone new' },
        { time: '18:40', title: 'Shape our clubs', detail: "Vote for the clubs you'd join and share your ideas" },
        { time: '19:00', title: 'Group photo and goodbye', detail: 'One photo of everyone, then see you at the next event' }
      ],
      checklist: [
        { text: 'Book the room', done: false },
        { text: 'Make the poster', done: false },
        { text: 'Post on Instagram and WhatsApp', done: false },
        { text: 'Prepare name tags', done: false },
        { text: 'Send the feedback form', done: false }
      ],
      publishedAt: new Date()
    };

    await Activity.findOneAndUpdate({ slug: welcomeActivity.slug }, welcomeActivity, { upsert: true, new: true });
    console.log('Seeded Welcome Evening activity.');

    // 2. Draft / To Confirm Activities (Nov - Jun)
    const futureActivities = [
      { slug: 'my-country-in-5-minutes', title: 'My Country in 5 Minutes', targetMonth: 'November' },
      { slug: 'christmas-around-the-world', title: 'Christmas Around the World', targetMonth: 'December' },
      { slug: 'international-movie-night', title: 'International Movie Night', targetMonth: 'January' },
      { slug: 'language-exchange-night', title: 'Language Exchange Night', targetMonth: 'February' },
      { slug: 'international-food-stories', title: 'International Food Stories and Potluck', targetMonth: 'March' },
      { slug: 'international-picnic', title: 'International Picnic', targetMonth: 'April' },
      { slug: 'international-talent-night', title: 'International Talent Night', targetMonth: 'May' },
      { slug: 'farewell-event', title: 'Farewell', targetMonth: 'June' }
    ];

    for (const act of futureActivities) {
      await Activity.findOneAndUpdate(
        { slug: act.slug },
        {
          slug: act.slug,
          title: act.title,
          targetMonth: act.targetMonth,
          dateToConfirm: true,
          status: 'published',
          costChoice: 'free',
          askIfGoing: true,
          publishedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${futureActivities.length} future placeholder activities.`);

    // 3. Six Club Interest Areas
    const clubAreas = [
      { name: 'Culture and conversation', description: 'Coffee, stories and traditions from home', order: 1 },
      { name: 'Languages', description: 'Teach your language, learn Romanian', order: 2 },
      { name: 'Film, music and arts', description: 'Screenings, open mics, creative nights', order: 3 },
      { name: 'City and travel', description: 'Walks, trips and hidden spots in Craiova', order: 4 },
      { name: 'Sports and wellbeing', description: 'Games, runs, yoga and fresh air', order: 5 },
      { name: 'Ideas and careers', description: 'Talks, debates and future plans', order: 6 }
    ];

    for (const area of clubAreas) {
      await ClubArea.findOneAndUpdate(
        { name: area.name },
        { ...area, isPublished: true },
        { upsert: true, new: true }
      );
    }
    console.log('Seeded 6 club interest areas.');

    // 4. October Word of the Month
    await WordOfTheMonth.findOneAndUpdate(
      { month: 'October 2026' },
      {
        month: 'October 2026',
        word: 'dor',
        pronunciation: 'Say it like "door", with a rolled r',
        meaning: 'A deep longing for someone or something you love, often home. Romanians say it has no exact translation.',
        exampleRo: 'Mi-e dor de casă.',
        exampleEn: 'I miss home.',
        challenge: 'Use "dor" once this week with a Romanian friend, and see if they notice.',
        isPublished: true,
        isCurrent: true
      },
      { upsert: true, new: true }
    );
    console.log('Seeded October word of the month: dor.');

    // 5. Six Everyday Phrases
    const phrases = [
      { romanian: 'Bună', pronunciation: 'BOO-nuh', english: 'Hi', order: 1 },
      { romanian: 'Mulțumesc', pronunciation: 'mool-tsoo-MESK', english: 'Thank you', order: 2 },
      { romanian: 'Noroc', pronunciation: 'no-ROK', english: 'Cheers, or good luck', order: 3 },
      { romanian: 'Poftă bună', pronunciation: 'POF-tuh BOO-nuh', english: 'Enjoy your meal', order: 4 },
      { romanian: 'Pe curând', pronunciation: 'peh koo-RUHND', english: 'See you soon', order: 5 },
      { romanian: 'Nu înțeleg', pronunciation: 'noo uhn-tseh-LEG', english: "I don't understand", order: 6 }
    ];

    for (const phrase of phrases) {
      await Phrase.findOneAndUpdate(
        { romanian: phrase.romanian },
        { ...phrase, isPublished: true },
        { upsert: true, new: true }
      );
    }
    console.log('Seeded 6 Romanian phrases.');

    // 6. Monthly Questions
    const questions = [
      { month: 'October 2026', question: 'What do you hope to discover in Romania?', isOpen: true, isPublished: true, isCurrent: true },
      { month: 'November 2026', question: 'What does "home" mean to you?', isOpen: false, isPublished: true, isCurrent: false },
      { month: 'December 2026', question: 'What tradition from your country would you share?', isOpen: false, isPublished: true, isCurrent: false },
      { month: 'January 2027', question: 'What should universities look like in 2030?', isOpen: false, isPublished: true, isCurrent: false }
    ];

    for (const q of questions) {
      await MonthlyQuestion.findOneAndUpdate(
        { month: q.month },
        q,
        { upsert: true, new: true }
      );
    }
    console.log('Seeded 4 monthly questions.');

    // 7. SiteSettings Default
    const existingSettings = await SiteSettings.findOne({});
    if (!existingSettings) {
      await SiteSettings.create({});
      console.log('Seeded default site settings.');
    }

    console.log('Content seeding completed successfully.');
    await disconnectDB();
  } catch (err) {
    console.error('Failed to seed content:', err);
    process.exit(1);
  }
}

seedContent();
