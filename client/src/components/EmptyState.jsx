import React from 'react';

export function EmptyState({
  title = null,
  message,
  action = null,
  icon = null,
  style = {}
}) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        backgroundColor: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        ...style
      }}
    >
      {icon && <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{icon}</div>}
      {title && (
        <h4 style={{ fontSize: '1.15rem', color: 'var(--navy)', margin: 0 }}>
          {title}
        </h4>
      )}
      <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: 0, fontSize: '0.95rem' }}>
        {message}
      </p>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}
