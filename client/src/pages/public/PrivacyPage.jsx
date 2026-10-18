import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card.jsx';
import { api } from '../../lib/api.js';

export function PrivacyPage() {
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.get('/public/privacy')
      .then((res) => setNotice(res.privacyNotice))
      .catch(() => {});
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#F2F3F6',
        minHeight: 'calc(100vh - 112px)',
        padding: '56px 24px',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div style={{ maxWidth: '840px', width: '100%' }}>
        <Card style={{ padding: '40px' }}>
          <h1
            style={{
              margin: '0 0 20px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '36px',
              lineHeight: 1.2,
              color: '#18203A'
            }}
          >
            Privacy Notice
          </h1>

          <div
            style={{
              fontSize: '17px',
              lineHeight: '28px',
              color: '#2E3650',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <p style={{ margin: 0 }}>
              The International Relations Department at the University of Craiova manages this platform. We respect your privacy and are committed to protecting your personal data in full compliance with the EU General Data Protection Regulation (GDPR).
            </p>

            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '16px 0 0', color: '#18203A' }}>
              Data We Collect
            </h2>
            <p style={{ margin: 0 }}>
              We collect only the minimal data required to verify your student status and support community activities:
            </p>
            <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Name and University Email:</strong> Used to create and secure your community account.</li>
              <li><strong>Country of Origin:</strong> Displayed on our community map to celebrate diversity.</li>
              <li><strong>Mobile Number (Optional):</strong> Kept strictly confidential for staff emergency contact.</li>
              <li><strong>Faculty and Programme:</strong> To connect you with relevant university events.</li>
            </ul>

            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '16px 0 0', color: '#18203A' }}>
              Public Display Privacy
            </h2>
            <p style={{ margin: 0 }}>
              Public sections of the website (such as the community map, answers on the international wall, and member words) show <strong>only your first name and country</strong>. Your surname, email address, and mobile number are never published or shared with third parties.
            </p>

            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '16px 0 0', color: '#18203A' }}>
              Cookies & Tracking
            </h2>
            <p style={{ margin: 0 }}>
              This platform uses only essential functional cookies for authentication (`ucv_sid`) and anonymous upvoting. We do not use third-party analytics, tracking pixels, or advertising networks. All typography is hosted locally to ensure zero external IP transmission.
            </p>

            {notice && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '20px',
                  backgroundColor: '#F2F3F6',
                  borderRadius: '12px',
                  borderLeft: '4px solid #B42318'
                }}
              >
                <strong style={{ display: 'block', marginBottom: '6px', color: '#18203A' }}>
                  Official Office Notice:
                </strong>
                <span style={{ whiteSpace: 'pre-line' }}>{notice}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
