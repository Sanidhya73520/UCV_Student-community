import React from 'react';

/**
 * 28 px Romanian embroidery strip across the very top of every page.
 * Made of repeating red (#B42318), marigold (#E0A200), navy (#18203A) squares on white.
 */
export function StitchBand() {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        width: '100%',
        height: '28px',
        backgroundColor: '#FFFFFF',
        backgroundImage: 'url(/brand/stitch-band.svg)',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'left center',
        backgroundSize: 'auto 28px',
        flexShrink: 0
      }}
    />
  );
}
