import React from 'react';
import { Link } from 'react-router-dom';

export function PublicFooter({ settings = null }) {
  const officialUrl = settings?.officialInfoUrl || 'https://www.ucv.ro';
  const hasOfficeDetails =
    settings?.whereToFindUs || settings?.officeHours || settings?.officeEmail;

  return (
    <footer
      style={{
        backgroundColor: 'var(--white)',
        borderTop: '1px solid var(--border)',
        padding: '36px 24px',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        marginTop: 'auto'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px'
        }}
      >
        <p style={{ fontWeight: 600, color: 'var(--navy)', margin: 0 }}>
          UCV International Student Community, University of Craiova
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--navy)', textDecoration: 'underline' }}
          >
            Official information: www.ucv.ro
          </a>
          {/* <span>•</span>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
            Privacy
          </Link> */}
        </div>

        {hasOfficeDetails && (
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            IR Office:{' '}
            {[settings.whereToFindUs, settings.officeHours].filter(Boolean).join(', ')}
            {settings.officeEmail && (
              <>
                {', '}
                <a
                  href={`mailto:${settings.officeEmail}`}
                  style={{ color: 'var(--red)', textDecoration: 'underline' }}
                >
                  {settings.officeEmail}
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </footer>
  );
}
