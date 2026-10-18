import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/db/connect.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';

async function seedAdmin() {
  const resetPassword = process.argv.includes('--reset-password');

  try {
    await connectDB();
    console.log('Connected to database.');

    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in root .env.');
      await disconnectDB();
      process.exit(1);
    }

    const adminEmail = env.ADMIN_EMAIL.toLowerCase().trim();
    const adminName = env.ADMIN_NAME || 'Staff Administrator';
    const adminPassword = env.ADMIN_PASSWORD;

    let user = await User.findOne({ email: adminEmail });

    if (user && !resetPassword) {
      console.log(`Admin account ${adminEmail} already exists. Use --reset-password to update credentials.`);
      await disconnectDB();
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    if (!user) {
      user = new User({
        fullName: adminName,
        firstName: adminName.split(' ')[0],
        email: adminEmail,
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
      await user.save();
      console.log('==================================================');
      console.log('PERMANENT ADMIN CREATED:');
      console.log(`Email:    ${adminEmail}`);
      console.log('Password: [CONFIGURED IN .ENV]');
      console.log('Sign in at /staff/login or /signin');
      console.log('==================================================');
    } else {
      user.passwordHash = passwordHash;
      user.temporaryPasswordHash = null;
      user.tempPasswordExpiresAt = null;
      user.mustChangePassword = false;
      user.isPermanentAdmin = true;
      user.role = 'admin';
      user.status = 'active';
      await user.save();
      console.log('==================================================');
      console.log('PERMANENT ADMIN PASSWORD UPDATED:');
      console.log(`Email:    ${adminEmail}`);
      console.log('Password: [CONFIGURED IN .ENV]');
      console.log('==================================================');
    }

    await disconnectDB();
  } catch (err) {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  }
}

seedAdmin();
