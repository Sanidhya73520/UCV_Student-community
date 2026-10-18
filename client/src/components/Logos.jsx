import React from 'react';
import { Link } from 'react-router-dom';

export function Logos({ linkToHome = true, subtitle = null, isHero = false }) {
  const content = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '14px',
        textDecoration: 'none',
        flexShrink: 0
      }}
    >
      <img
        src="/brand/community-logo.png"
        alt="UCV International Student Community"
        className="community-logo-img"
        style={{
          width: isHero ? '96px' : 'auto',
          height: isHero ? '56px' : '52px',
          maxWidth: '100px',
          objectFit: 'contain',
          display: 'block'
        }}
      />
      <span
        aria-hidden="true"
        style={{
          width: '1px',
          height: isHero ? '40px' : '38px',
          backgroundColor: 'rgba(24, 32, 58, 0.3)',
          display: 'block'
        }}
      />
      <img
        src="/brand/ucv-crest.png"
        alt="University of Craiova"
        className="ucv-crest-img"
        style={{
          width: isHero ? '38px' : 'auto',
          height: isHero ? '52px' : '48px',
          maxWidth: '38px',
          objectFit: 'contain',
          display: 'block'
        }}
      />
      {subtitle && (
        <span
          style={{
            fontSize: '0.85rem',
            color: 'var(--red)',
            fontWeight: 600,
            marginLeft: '4px',
            alignSelf: 'flex-end',
            marginBottom: '4px'
          }}
        >
          {subtitle}
        </span>
      )}
      <style>{`
        @media (max-width: 640px) {
          .community-logo-img {
            height: 38px !important;
            max-width: 76px !important;
          }
          .ucv-crest-img {
            height: 36px !important;
            max-width: 28px !important;
          }
        }
      `}</style>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" style={{ textDecoration: 'none' }} aria-label="UCV International Student Community, home">
        {content}
      </Link>
    );
  }

  return content;
}
