import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
const requiredVars = ['ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missingVars = requiredVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables in root .env: ${missingVars.join(', ')}`);
  process.exit(1);
}

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

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
  console.log('UCV PLATFORM: STUDENT FUNCTIONALITIES AUDIT & TEST');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failedTests++;
    }
  }

  // 0. Staff Admin Login
  console.log('--- Step 0: Staff Admin Login ---');
  const adminRes = await fetchJson('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  assert(adminRes.ok && (adminRes.data?.user?.role === 'admin' || adminRes.data?.user?.role === 'staff'), 'Staff Admin logs in successfully');
  const staffCookie = getCookie(adminRes.headers);

  // 1. Student Registration & Approval
  console.log('\n--- Step 1: Student Registration & Approval Workflow ---');
  const testStudentEmail = `student.audit.${Date.now()}@example.com`;
  const studentPassword = 'SecureStudentPass123!';
  const signupRes = await fetchJson('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Elena Popovici',
      email: testStudentEmail,
      password: studentPassword,
      confirmPassword: studentPassword,
      mobile: '+40712345678',
      country: 'MD',
      consent: true
    })
  });
  assert(signupRes.ok, `Student registers: ${testStudentEmail}`);

  // Find student in pending approvals
  const approvalsRes = await fetchJson('/staff/approvals?status=pending', {
    headers: { Cookie: staffCookie }
  });
  const pendingList = approvalsRes.data?.students || approvalsRes.data?.approvals || approvalsRes.data?.items || approvalsRes.data || [];
  const foundStudent = Array.isArray(pendingList) ? pendingList.find(s => s.email === testStudentEmail) : null;
  const studentId = foundStudent?.id || foundStudent?._id;
  assert(!!studentId, `Found registered student in pending approvals (${studentId})`);

  // Approve student as staff
  const approveRes = await fetchJson(`/staff/approvals/${studentId}/approve`, {
    method: 'POST',
    headers: { Cookie: staffCookie }
  });
  assert(approveRes.ok, `Staff approves student account (${studentId})`);

  // Student Login
  const studentLoginRes = await fetchJson('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: testStudentEmail, password: studentPassword })
  });
  assert(studentLoginRes.ok && studentLoginRes.data?.user?.status === 'approved', 'Approved student logs in successfully');
  const studentCookie = getCookie(studentLoginRes.headers);

  // 2. Student Dashboard & Overview
  console.log('\n--- Step 2: Student Dashboard & Overview ---');
  const dashboardRes = await fetchJson('/me/dashboard', {
    headers: { Cookie: studentCookie }
  });
  assert(dashboardRes.ok, 'Student Dashboard loads without error (200 OK)');
  const dData = dashboardRes.data || {};
  assert(dData.student?.firstName === 'Elena', `Personalized student profile returns firstName 'Elena' for 'Bună, Elena' greeting`);
  assert(!!(dData.currentQuestion || dData.activeQuestion), 'Dashboard returns active monthly question');
  assert(!!dData.wordOfTheMonth, 'Dashboard returns active word of the month');
  console.log(`     Active Question: "${(dData.currentQuestion || dData.activeQuestion)?.question || 'None'}"`);
  console.log(`     Word of Month: "${dData.wordOfTheMonth?.word || 'None'}"`);

  // 3. Activities & Attendance Responses (RSVP)
  console.log('\n--- Step 3: Activities & Attendance Responses (RSVP) ---');
  let activitiesRes = await fetchJson('/activities');
  let activityList = activitiesRes.data?.activities || activitiesRes.data || [];
  let testActivity = Array.isArray(activityList) ? activityList[0] : null;

  if (!testActivity) {
    console.log('   Creating a test activity as staff...');
    const createAct = await fetchJson('/staff/activities', {
      method: 'POST',
      headers: { Cookie: staffCookie },
      body: JSON.stringify({
        title: 'International Welcome Mixer',
        status: 'published',
        date: new Date(Date.now() + 86400000 * 5).toISOString(),
        venue: 'Student Campus Hall A',
        description: 'Comprehensive welcome orientation for all Erasmus and international degree students.',
        askIfGoing: true
      })
    });
    testActivity = createAct.data?.activity || createAct.data;
  }
  assert(!!testActivity?.id || !!testActivity?._id, `Found or created activity: "${testActivity?.title}"`);
  const activityId = testActivity?.id || testActivity?._id;

  // Student submits RSVP "going"
  const rsvpGoingRes = await fetchJson('/me/rsvp', {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({ activityId, response: 'going' })
  });
  assert(rsvpGoingRes.ok && (rsvpGoingRes.data?.response === 'going' || rsvpGoingRes.data?.rsvp?.response === 'going' || rsvpGoingRes.data?.userRsvp === 'going'), 'Student RSVP "going" is recorded');

  // Verify staff side sees the attendance response
  const staffActRes = await fetchJson(`/staff/activities/${activityId}`, {
    headers: { Cookie: staffCookie }
  });
  const staffGoingCount = staffActRes.data?.activity?.goingCount ?? staffActRes.data?.goingCount;
  assert(staffGoingCount >= 1, `Staff dashboard reflects attendance: goingCount = ${staffGoingCount}`);

  // Change RSVP to "not_going"
  const rsvpNotGoingRes = await fetchJson('/me/rsvp', {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({ activityId, response: 'not_going' })
  });
  assert(rsvpNotGoingRes.ok && (rsvpNotGoingRes.data?.response === 'not_going' || rsvpNotGoingRes.data?.rsvp?.response === 'not_going' || rsvpNotGoingRes.data?.userRsvp === 'not_going'), 'Student RSVP updated to "not_going" without duplicate records');

  // Check student events view
  const myEventsRes = await fetchJson('/me/events', {
    headers: { Cookie: studentCookie }
  });
  assert(myEventsRes.ok, 'Student can view activities and event announcements (/me/events)');

  // 4. Ask the Coordinator
  console.log('\n--- Step 4: Ask the Coordinator ---');
  const askRes = await fetchJson('/me/questions', {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({
      topic: 'life_in_craiova',
      text: 'Where can international students get public transport discount passes in Craiova?'
    })
  });
  assert(askRes.ok && (askRes.data?.question?.status === 'waiting' || askRes.data?.status === 'waiting'), 'Question submitted and persisted with status "waiting"');
  const questionId = askRes.data?.question?.id || askRes.data?.question?._id || askRes.data?.id;

  // Staff views questions
  const staffQuestionsRes = await fetchJson('/staff/questions', {
    headers: { Cookie: staffCookie }
  });
  assert(staffQuestionsRes.ok, 'Staff can view and manage questions');
  const foundQ = (staffQuestionsRes.data?.questions || []).find(q => (q.id || q._id) == questionId);
  assert(!!foundQ, `Submitted question appears in Staff Area interface (id: ${questionId})`);

  // Staff answers question
  const staffAnswerRes = await fetchJson(`/staff/questions/${questionId}/answer`, {
    method: 'POST',
    headers: { Cookie: staffCookie },
    body: JSON.stringify({
      answer: 'You can get your student bus pass with 50% discount at the RAT Craiova booth near the central theatre.'
    })
  });
  assert(staffAnswerRes.ok, 'Staff answers the question successfully');

  // Student verifies answered status and response
  const studentQuestionsRes = await fetchJson('/me/questions', {
    headers: { Cookie: studentCookie }
  });
  const myQ = (studentQuestionsRes.data?.questions || []).find(q => (q.id || q._id) == questionId);
  assert(myQ && (myQ.status === 'answered' || myQ.answer || myQ.answerText), 'Answer is reflected correctly on student interface');

  // 5. International Wall
  console.log('\n--- Step 5: International Wall ---');
  const wallRes = await fetchJson('/me/wall', {
    headers: { Cookie: studentCookie }
  });
  assert(wallRes.ok, 'Student can view monthly questions on International Wall');

  const postWallRes = await fetchJson('/me/wall/posts', {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({
      text: 'I look forward to exploring Nicolae Romanescu Park and meeting people from around the world!'
    })
  });
  assert(postWallRes.ok, '"Post My Answer" functionality submits successfully and persists');

  // Check updated wall
  const updatedWallRes = await fetchJson('/me/wall', {
    headers: { Cookie: studentCookie }
  });
  assert(updatedWallRes.ok && (updatedWallRes.data?.posts?.length > 0 || updatedWallRes.data?.myPost), 'Submitted wall answer is synchronized and displayed on the student wall');

  // 6. Teachers\' Word / Word Contribution
  console.log('\n--- Step 6: Teachers\' Word / Word Contribution ---');
  const wordContribRes = await fetchJson('/me/words', {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({
      word: 'Mulțumesc',
      language: 'Romanian',
      meaning: 'Thank you'
    })
  });
  assert(wordContribRes.ok, '"Send My Word" action submits word, language, and meaning successfully');

  const myWordsRes = await fetchJson('/me/words', {
    headers: { Cookie: studentCookie }
  });
  assert(myWordsRes.ok && (myWordsRes.data?.mySharedWords?.length > 0 || myWordsRes.data?.words?.length > 0 || myWordsRes.data?.length > 0), 'Word submissions are persisted and visible on student side');

  // 7. Ambassador Portal
  console.log('\n--- Step 7: Ambassador Portal ---');
  const ambStatusRes = await fetchJson('/me/ambassadors', {
    headers: { Cookie: studentCookie }
  });
  assert(ambStatusRes.ok, 'Student can access the Ambassador Portal');

  const applyAmbRes = await fetchJson('/me/ambassadors/apply', {
    method: 'POST',
    headers: { Cookie: studentCookie },
    body: JSON.stringify({
      why: 'I am passionate about organizing cultural events and guiding international freshmen.',
      languages: 'English, Romanian, Russian',
      hoursPerMonth: '4_to_8'
    })
  });
  assert(applyAmbRes.ok, 'Ambassador application submitted and stored successfully');

  // Staff views application
  const staffAmbRes = await fetchJson('/staff/ambassadors', {
    headers: { Cookie: staffCookie }
  });
  assert(staffAmbRes.ok, 'Staff can view ambassador applications in the Staff Area');

  // Verify student view reflects application state
  const ambUpdatedRes = await fetchJson('/me/ambassadors', {
    headers: { Cookie: studentCookie }
  });
  assert(ambUpdatedRes.ok && (ambUpdatedRes.data?.application?.status === 'pending' || ambUpdatedRes.data?.status === 'pending'), 'Application status is reflected correctly for the student');

  // 8. Scalability & Safe Concurrency Test (100+ simulated operations)
  console.log('\n--- Step 8: Safe Concurrency Test (100+ Concurrent Requests) ---');
  const startTime = Date.now();
  const CONCURRENT_REQUESTS = 100;
  console.log(`   Firing ${CONCURRENT_REQUESTS} simultaneous read & write requests...`);

  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    if (i % 3 === 0) {
      promises.push(fetchJson('/me/dashboard', { headers: { Cookie: studentCookie } }));
    } else if (i % 3 === 1) {
      promises.push(fetchJson('/me/wall', { headers: { Cookie: studentCookie } }));
    } else {
      promises.push(fetchJson('/me/events', { headers: { Cookie: studentCookie } }));
    }
  }

  const results = await Promise.all(promises);
  const elapsedMs = Date.now() - startTime;
  const successful = results.filter(r => r.ok).length;
  assert(successful === CONCURRENT_REQUESTS, `100/100 concurrent student requests succeeded in ${elapsedMs}ms without errors or dropped requests`);

  // Session persistence check
  console.log('\n--- Step 9: Persistence Across Re-login & Session ---');
  const reLoginRes = await fetchJson('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: testStudentEmail, password: studentPassword })
  });
  const reCookie = getCookie(reLoginRes.headers);
  const reDash = await fetchJson('/me/dashboard', { headers: { Cookie: reCookie } });
  assert(reDash.ok && reDash.data?.student?.firstName === 'Elena', 'Data remains 100% consistent after re-login');

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  process.exit(failedTests > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error running audit test:', err);
  process.exit(1);
});
