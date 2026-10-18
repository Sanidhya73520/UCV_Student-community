import { connectDB, disconnectDB } from '../src/db/connect.js';
import { ClubArea } from '../src/models/ClubArea.js';
import mongoose from 'mongoose';

export const DESIRED_INTEREST_AREAS = [
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

async function seed() {
  await connectDB();

  console.log('[SEED] Cleaning up old dummy or non-standard test interest areas...');
  const desiredNames = DESIRED_INTEREST_AREAS.map((a) => a.name.toLowerCase());
  const existing = await ClubArea.find({}).lean();
  
  for (const item of existing) {
    if (!desiredNames.includes(item.name.toLowerCase())) {
      console.log(`[SEED] Removing obsolete area: "${item.name}"`);
      await ClubArea.deleteOne({ _id: item._id });
    }
  }

  console.log('[SEED] Ensuring the 13 required interest areas...');
  for (let i = 0; i < DESIRED_INTEREST_AREAS.length; i++) {
    const item = DESIRED_INTEREST_AREAS[i];
    await ClubArea.findOneAndUpdate(
      { name: item.name },
      {
        $set: {
          name: item.name,
          description: item.description,
          order: i,
          isPublished: true
        },
        $setOnInsert: {
          upvoteCount: 0
        }
      },
      { upsert: true, new: true }
    );
  }

  const all = await ClubArea.find({}).sort({ order: 1 }).lean();
  console.log(`[SEED] Successfully configured ${all.length} interest areas in Atlas MongoDB:`);
  all.forEach((a, idx) => console.log(`  ${idx + 1}. ${a.name}`));

  await disconnectDB();
  console.log('[SEED] Disconnected cleanly.');
}

seed().catch((err) => {
  console.error('[SEED] Error seeding interest areas:', err);
  process.exit(1);
});
