import React from 'react';

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-sm)',
  style = {}
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#E2E6EC',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style
      }}
    />
  );
}
