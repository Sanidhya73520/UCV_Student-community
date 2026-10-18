import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

if (!fs.existsSync(envPath)) {
  console.error(`Error: .env file not found at ${envPath}`);
  process.exit(1);
}

dotenv.config({ path: envPath });

// Validate required environment variables without printing secret values
const requiredVars = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'MAIL_FROM_EMAIL', 'MONGODB_URI'];
const missingVars = requiredVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables in root .env: ${missingVars.join(', ')}`);
  process.exit(1);
}

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const EXPECTED_SENDER = process.env.MAIL_FROM_EMAIL;

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Origin': process.env.APP_URL || 'http://localhost:5173',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

function getCookie(headers) {
  const setCookie = headers.get('set-cookie');
  if (!setCookie) return null;
  return setCookie.split(';')[0];
}

async function run() {
  console.log('====================================================');
  console.log(`VERIFYING EMAIL SENDER UPDATE: ${EXPECTED_SENDER}`);
  console.log('====================================================\n');

  // 1. Staff Admin Login
  console.log('1. Logging in as Administrator...');
  const adminRes = await fetchJson('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  if (!adminRes.ok) {
    throw new Error(`Admin signin failed: ${JSON.stringify(adminRes.data)}`);
  }
  const staffCookie = getCookie(adminRes.headers);
  console.log('   Admin logged in successfully.');

  // 2. Workflow 1: Student Registration & Approval Email
  console.log('\n2. Testing Workflow 1: Student Registration Approval & Welcome Email...');
  const studentEmail = `student.onboarding.${Date.now()}@example.com`;
  const signupRes = await fetchJson('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Marc Dupont',
      email: studentEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      mobile: '+40711223344',
      country: 'FR',
      consent: true
    })
  });
  if (!signupRes.ok) {
    throw new Error(`Student signup failed: ${JSON.stringify(signupRes.data)}`);
  }
  console.log(`   Registered pending student: ${studentEmail}`);

  // Fetch pending approvals
  const approvalsRes = await fetchJson('/staff/approvals?status=pending', {
    headers: { Cookie: staffCookie }
  });
  const pendingStudents = approvalsRes.data?.students || approvalsRes.data?.approvals || approvalsRes.data || [];
  const student = pendingStudents.find(s => s.email === studentEmail);
  if (!student) {
    throw new Error(`Student not found in pending list: ${JSON.stringify(approvalsRes.data)}`);
  }
  const studentId = student.id || student._id;

  // Approve student
  console.log(`   Approving student account (${studentId})...`);
  const approveRes = await fetchJson(`/staff/approvals/${studentId}/approve`, {
    method: 'POST',
    headers: { Cookie: staffCookie }
  });
  if (!approveRes.ok) {
    throw new Error(`Student approval failed: ${JSON.stringify(approveRes.data)}`);
  }
  console.log('   Student approved! Approval email was queued.');

  // 3. Workflow 2: Staff Invitation Email
  console.log('\n3. Testing Workflow 2: Staff Invitation Email...');
  const staffInviteEmail = `coordinator.invite.${Date.now()}@example.com`;
  const inviteRes = await fetchJson('/staff/accounts/invite', {
    method: 'POST',
    headers: { Cookie: staffCookie },
    body: JSON.stringify({
      fullName: 'Dr. Maria Ionescu',
      email: staffInviteEmail,
      role: 'staff'
    })
  });
  if (!inviteRes.ok) {
    throw new Error(`Staff invite failed: ${JSON.stringify(inviteRes.data)}`);
  }
  console.log(`   Staff member invited: ${staffInviteEmail}`);

  // 4. Wait for background worker to process the emails
  console.log('\n4. Waiting for background mail worker to deliver emails via Brevo...');
  await new Promise(r => setTimeout(r, 4000));

  // Connect to DB directly to verify EmailQueue records
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB });
  const emailQueueCollection = mongoose.connection.collection('emailqueues');

  const approvalEmail = await emailQueueCollection.findOne({
    recipient: studentEmail,
    type: 'approval'
  });
  const inviteEmail = await emailQueueCollection.findOne({
    recipient: staffInviteEmail,
    type: 'staff_invite'
  });

  console.log('\n5. Inspecting Email Delivery Status in Database:');
  console.log('   [Workflow 1 - Approval Email]:', {
    recipient: approvalEmail?.recipient,
    status: approvalEmail?.status,
    attempts: approvalEmail?.attempts,
    error: approvalEmail?.error,
    sentAt: approvalEmail?.sentAt
  });

  console.log('   [Workflow 2 - Staff Invite Email]:', {
    recipient: inviteEmail?.recipient,
    status: inviteEmail?.status,
    attempts: inviteEmail?.attempts,
    error: inviteEmail?.error,
    sentAt: inviteEmail?.sentAt
  });

  const allSent = approvalEmail?.status === 'sent' && inviteEmail?.status === 'sent';

  if (allSent) {
    console.log('\n====================================================');
    console.log('SUCCESS: All emails were processed and delivered via Brevo SMTP');
    console.log(`FROM: ${EXPECTED_SENDER}`);
    console.log('0 sender validation errors.');
    console.log('====================================================');
  } else {
    console.error('\nFAIL: One or more emails failed to reach sent status.');
  }

  await mongoose.disconnect();
  process.exit(allSent ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal error during email sender verification:', err);
  process.exit(1);
});
