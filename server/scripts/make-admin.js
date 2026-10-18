import { connectDB, disconnectDB } from '../src/db/connect.js';
import { User } from '../src/models/User.js';

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`Error: No user found with email ${email}`);
      await disconnectDB();
      process.exit(1);
    }

    if (user.role === 'student') {
      console.error(`Error: Cannot promote a student account (${email}) to admin. Only staff accounts can become admin.`);
      await disconnectDB();
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`${user.fullName} (${email}) is already an administrator.`);
      await disconnectDB();
      return;
    }

    user.role = 'admin';
    await user.save();
    console.log(`Success: Promoted ${user.fullName} (${email}) to administrator.`);

    await disconnectDB();
  } catch (err) {
    console.error('Failed to promote user:', err);
    process.exit(1);
  }
}

makeAdmin();
