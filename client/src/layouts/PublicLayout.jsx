import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StitchBand } from '../components/StitchBand.jsx';
import { PublicHeader } from '../components/PublicHeader.jsx';
import { PublicFooter } from '../components/PublicFooter.jsx';

export function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)', position: 'relative' }}>
      <StitchBand />
      <PublicHeader transparentHero={isHome} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
