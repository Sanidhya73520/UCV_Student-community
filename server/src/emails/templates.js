import { env } from '../config/env.js';

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const CANONICAL_APP_URL = 'https://ucvinternationalstudent-community.vercel.app';
export function getAppUrl() {
  const url = env.APP_URL?.trim();
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
    return CANONICAL_APP_URL;
  }
  return url.replace(/\/+$/, '');
}


function emailWrapper({ title, contentHtml, buttonText, buttonUrl, footerExtra = '' }) {
    const baseUrl = getAppUrl();
  const fullUrl = buttonUrl.startsWith('http') ? buttonUrl : `${baseUrl}${buttonUrl.startsWith('/') ? '' : '/'}${buttonUrl}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F3F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18203A;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F2F3F6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Stitch Band Accent -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #B42318; height: 6px; border-radius: 8px 8px 0 0;">
          <tr><td></td></tr>
        </table>
        
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 0 0 16px 16px; box-shadow: 0 2px 8px rgba(24,32,58,0.06); padding: 36px 32px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #D9DDE6;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 16px; font-weight: 700; color: #18203A;">
                    UCV International Student Community
                  </td>
                  <td align="right" style="font-size: 12px; color: #4A536B;">
                    University of Craiova
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-top: 28px; padding-bottom: 28px; font-size: 16px; line-height: 1.6; color: #18203A;">
              ${contentHtml}
              
              ${
                buttonText && fullUrl
                  ? `
              <div style="margin: 32px 0 24px 0; text-align: center;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${fullUrl}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="15%" stroke="f" fillcolor="#B42318">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${escapeHtml(
                  buttonText
                )}</center>
                </v:roundrect>
                <![endif]-->
                <a href="${fullUrl}" target="_blank" style="background-color: #B42318; color: #FFFFFF; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block;">
                  ${escapeHtml(buttonText)}
                </a>
              </div>
              <p style="font-size: 13px; color: #4A536B; margin-top: 24px; word-break: break-all;">
                Button not working? Copy this link:<br>
                <a href="${fullUrl}" style="color: #B42318;">${fullUrl}</a>
              </p>
              `
                  : ''
              }
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 20px; border-top: 1px solid #D9DDE6; font-size: 12px; color: #4A536B; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">International Relations Department, University of Craiova.</p>
              ${footerExtra ? `<p style="margin: 0 0 6px 0;">${footerExtra}</p>` : ''}
               <p style="margin: 0;">You can choose which emails you get in <a href="${getAppUrl()}/student/profile" style="color: #B42318;">My profile</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

export const emailTemplates = {
  // 1. Approval email (matches screen 21)
  approval: ({ firstName, fullName }) => {
    const name = firstName || fullName?.split(' ')[0] || 'Student';
    const escapedName = escapeHtml(name);
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">Welcome, ${escapedName}! Your account is approved</h2>
      <p style="margin: 0 0 14px 0;">Good news: the International Relations Department has approved your registration for the UCV International Student Community.</p>
      <p style="margin: 0 0 14px 0;">You can now sign in with the email and password you chose when you signed up.</p>
    `;
    const text = `Welcome, ${name}! Your account is approved

Good news: the International Relations Department has approved your registration for the UCV International Student Community.

You can now sign in with the email and password you chose when you signed up.

Sign in: ${getAppUrl()}/signin

International Relations Department, University of Craiova.`;

    return {
      subject: 'Your account is approved: welcome to the community!',
      html: emailWrapper({
        title: 'Your account is approved',
        contentHtml,
        buttonText: 'Log In to Portal',
        buttonUrl: '/signin',
        footerExtra: "You're receiving this because you signed up for the UCV International Student Community."
      }),
      text
    };
  },

  // 2. Staff Invitation (matches screen 33)
  staffInvite: ({ inviterName, fullName, email, tempPassword }) => {
    const sender = inviterName || env.ADMIN_NAME || 'An administrator';
    const recipientEmail = email || '';
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">You're invited to the staff area</h2>
      <p style="margin: 0 0 14px 0;">${escapeHtml(sender)} has invited you to help manage the UCV International Student Community platform for the International Relations Department.</p>
      <p style="margin: 0 0 20px 0;">Sign in with the details below. On your first sign-in you'll be asked to set your own password.</p>
      
      <div style="background-color: #F2F3F6; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-family: monospace; font-size: 14px;">
        <p style="margin: 0 0 6px 0;"><strong>Login page:</strong> ${getAppUrl()}/staff/login</p>
        <p style="margin: 0 0 6px 0;"><strong>Your email:</strong> ${escapeHtml(recipientEmail)}</p>
        <p style="margin: 0;"><strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
      </div>
      
      <p style="font-size: 13px; color: #4A536B; margin: 0 0 14px 0;">Valid for 7 days and for one sign-in only. You'll choose your own password straight after.</p>
    `;
    const text = `You're invited to the staff area

${sender} has invited you to help manage the UCV International Student Community platform for the International Relations Department.

Login page: ${getAppUrl()}/staff/login
Your email: ${recipientEmail}
Temporary password: ${tempPassword}

Valid for 7 days and for one sign-in only. You'll choose your own password straight after.

Sign in: ${getAppUrl()}/staff/login`;

    return {
      subject: 'You are invited to the UCV International Student Community staff area',
      html: emailWrapper({
        title: "You're invited to the staff area",
        contentHtml,
        buttonText: 'Log in to the staff area',
        buttonUrl: '/staff/login',
        footerExtra: "You're receiving this because an administrator invited you. If you weren't expecting this, you can ignore it."
      }),
      text
    };
  },

  // 3. Password Reset
  passwordReset: ({ firstName, resetToken }) => {
    const resetUrl = `/reset-password?token=${encodeURIComponent(resetToken)}`;
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">Reset your password</h2>
      <p style="margin: 0 0 14px 0;">Hi ${escapeHtml(firstName)}, someone asked to reset the password for your UCV International Student Community account.</p>
      <p style="margin: 0 0 14px 0;">If it was you, choose a new password below. The link works for 1 hour and only once.</p>
      <p style="margin: 0 0 14px 0;">If it wasn't you, ignore this email; your password stays the same.</p>
    `;
    const text = `Hi ${firstName}, someone asked to reset the password for your UCV International Student Community account.

If it was you, choose a new password below. The link works for 1 hour and only once.
${getAppUrl()}${resetUrl}

If it wasn't you, ignore this email; your password stays the same.`;

    return {
      subject: 'Reset your password',
      html: emailWrapper({
        title: 'Reset your password',
        contentHtml,
        buttonText: 'Choose a new password',
        buttonUrl: resetUrl
      }),
      text
    };
  },

  // 4. Activate Account (imported or added by staff)
  activateAccount: ({ firstName, resetToken }) => {
    const activateUrl = `/reset-password?token=${encodeURIComponent(resetToken)}&mode=activate`;
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">Finish setting up your account</h2>
      <p style="margin: 0 0 14px 0;">Hi ${escapeHtml(firstName)}, the International Relations Department has added you to the UCV International Student Community.</p>
      <p style="margin: 0 0 14px 0;">Choose your password to sign in. The link works for 7 days.</p>
    `;
    const text = `Hi ${firstName}, the International Relations Department has added you to the UCV International Student Community.

Choose your password to sign in. The link works for 7 days.
${getAppUrl()}${activateUrl}`;

    return {
      subject: 'Finish setting up your account',
      html: emailWrapper({
        title: 'Finish setting up your account',
        contentHtml,
        buttonText: 'Choose my password',
        buttonUrl: activateUrl
      }),
      text
    };
  },

  // 5. Account Exists
  accountExists: ({ isPending = false }) => {
    const contentHtml = isPending
      ? `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">You already have an account</h2>
      <p style="margin: 0 0 14px 0;">Hi, someone tried to create a new account with this email. You already have one.</p>
      <p style="margin: 0 0 14px 0;">Your account is still waiting for approval. We'll email you as soon as it's approved.</p>
    `
      : `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">You already have an account</h2>
      <p style="margin: 0 0 14px 0;">Hi, someone tried to create a new account with this email. You already have one.</p>
      <p style="margin: 0 0 14px 0;">If it was you, just sign in; if you forgot your password, you can reset it.</p>
    `;
    const text = isPending
      ? `Hi, someone tried to create a new account with this email. You already have one.

Your account is still waiting for approval. We'll email you as soon as it's approved.`
      : `Hi, someone tried to create a new account with this email. You already have one.

If it was you, just sign in; if you forgot your password, you can reset it.
Sign in: ${getAppUrl()}/signin
Reset password: ${getAppUrl()}/forgot-password`;

    return {
      subject: 'You already have an account',
      html: emailWrapper({
        title: 'You already have an account',
        contentHtml,
        buttonText: isPending ? null : 'Sign in',
        buttonUrl: '/signin'
      }),
      text
    };
  },

  // 6. Question Answered
  questionAnswered: ({ firstName, questionText, question }) => {
    const rawQuestion = questionText || question || '';
    const preview = rawQuestion.length > 100 ? `${rawQuestion.substring(0, 100)}…` : rawQuestion;
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">Your question has an answer</h2>
      <p style="margin: 0 0 14px 0;">Hi ${escapeHtml(firstName)}, the International Relations Team answered your question:</p>
      <blockquote style="margin: 0 0 16px 0; padding-left: 14px; border-left: 3px solid #D9DDE6; color: #4A536B; font-style: italic;">
        "${escapeHtml(preview)}"
      </blockquote>
      <p style="margin: 0 0 14px 0;">You can read the answer on your portal.</p>
    `;
    const text = `Hi ${firstName}, the International Relations Team answered your question: "${preview}".

See the answer: ${getAppUrl()}/student/questions`;

    return {
      subject: 'Your question has an answer',
      html: emailWrapper({
        title: 'Your question has an answer',
        contentHtml,
        buttonText: 'See the answer',
        buttonUrl: '/student/questions'
      }),
      text
    };
  },

  // 7. New Activity Published
  newActivity: ({ title, dateStr, venue, description }) => {
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">New activity: ${escapeHtml(title)}</h2>
      <p style="margin: 0 0 14px 0;"><strong>When & Where:</strong> ${escapeHtml(dateStr)} ${venue ? `at ${escapeHtml(venue)}` : ''}</p>
      <p style="margin: 0 0 14px 0;">${escapeHtml(description || '')}</p>
    `;
    const text = `New activity: ${title}

When & Where: ${dateStr} ${venue ? `at ${venue}` : ''}
${description || ''}

See the activity: ${getAppUrl()}/student/events`;

    return {
      subject: `New activity: ${title}`,
      html: emailWrapper({
        title: `New activity: ${title}`,
        contentHtml,
        buttonText: 'See the activity',
        buttonUrl: '/student/events'
      }),
      text
    };
  },

  // 8. Tomorrow Activity Reminder
  activityReminder: ({ title, dateStr, venue }) => {
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">Tomorrow: ${escapeHtml(title)}</h2>
      <p style="margin: 0 0 14px 0;">A friendly reminder for tomorrow's event!</p>
      <p style="margin: 0 0 14px 0;"><strong>Time & Location:</strong> ${escapeHtml(dateStr)} ${venue ? `at ${escapeHtml(venue)}` : ''}</p>
      <p style="margin: 0 0 14px 0;">We look forward to seeing you there.</p>
    `;
    const text = `Tomorrow: ${title}

Time & Location: ${dateStr} ${venue ? `at ${venue}` : ''}
We look forward to seeing you there.

See itinerary: ${getAppUrl()}/activities`;

    return {
      subject: `Tomorrow: ${title}`,
      html: emailWrapper({
        title: `Tomorrow: ${title}`,
        contentHtml,
        buttonText: 'See the itinerary',
        buttonUrl: '/activities'
      }),
      text
    };
  },

  // 9. Community Update
  communityUpdate: ({ questionText, wordText }) => {
    const contentHtml = `
      <h2 style="font-size: 22px; color: #18203A; margin: 0 0 16px 0;">New this month in the community</h2>
      ${questionText ? `<p style="margin: 0 0 10px 0;"><strong>Question of the month:</strong> ${escapeHtml(questionText)}</p>` : ''}
      ${wordText ? `<p style="margin: 0 0 10px 0;"><strong>Word of the month:</strong> ${escapeHtml(wordText)}</p>` : ''}
    `;
    const text = `New this month in the community:

${questionText ? `Question of the month: ${questionText}` : ''}
${wordText ? `Word of the month: ${wordText}` : ''}

Open the community: ${getAppUrl()}/student`;

    return {
      subject: 'New this month in the community',
      html: emailWrapper({
        title: 'New this month in the community',
        contentHtml,
        buttonText: 'Open the community',
        buttonUrl: '/student'
      }),
      text
    };
  }
};

export function renderTemplate(templateName, data) {
  const tpl = emailTemplates[templateName];
  if (!tpl) {
    throw new Error(`Email template "${templateName}" not found.`);
  }
  return tpl(data);
}

