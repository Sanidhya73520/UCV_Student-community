import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import { connectDB, disconnectDB } from '../src/db/connect.js';
import { queueEmail } from '../src/services/mailer.js';
import { emailTemplates } from '../src/emails/templates.js';
import { env } from '../src/config/env.js';

async function main() {
  const recipient = (process.argv[2] || env.ADMIN_EMAIL || '').trim();
  if (!recipient) {
    console.error('Error: Please provide a recipient email or configure ADMIN_EMAIL in root .env.');
    process.exit(1);
  }
  console.log(`Sending test email via Brevo SMTP to: ${recipient}...`);

  await connectDB();

  const recipientName = env.ADMIN_NAME ? env.ADMIN_NAME.split(' ')[0] : 'Test User';
  const template = emailTemplates.approval({
    firstName: recipientName
  });

  const result = await queueEmail({
    recipient,
    type: 'approval',
    subject: template.subject,
    html: template.html,
    text: template.text,
    priority: 1,
    immediate: true
  });

  console.log('Result:', {
    id: result._id,
    recipient: result.recipient,
    status: result.status,
    attempts: result.attempts,
    error: result.error || null,
    sentAt: result.sentAt || null
  });

  await disconnectDB();

  if (result.status === 'sent') {
    console.log('Test email delivered successfully via Brevo SMTP!');
  } else {
    console.error('Email failed to send. Check the error above.');
  }
}

main().catch((err) => {
  console.error('Fatal error running mail test:', err);
  process.exit(1);
});
