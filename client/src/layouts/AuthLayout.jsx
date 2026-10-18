import React from 'react';
import { Outlet } from 'react-router-dom';
import { StitchBand } from '../components/StitchBand.jsx';
import { PublicHeader } from '../components/PublicHeader.jsx';
import { PublicFooter } from '../components/PublicFooter.jsx';

export function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)' }}>
      <StitchBand />
      <PublicHeader />
      <main
        className="auth-main-layout"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '100%', maxWidth: '960px', boxSizing: 'border-box' }}>
          <Outlet />
        </div>
      </main>
      <PublicFooter />

      <style>{`
        @media (max-width: 900px) {
          .auth-main-layout {
            padding: 24px 16px !important;
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}
