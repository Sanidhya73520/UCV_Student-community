import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ErrorAlert({
  message,
  onRetry = null,
  retryLabel = 'Try again',
  style = {}
}) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'var(--pink-tint)',
        border: '1.5px solid var(--red)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--red)',
        fontSize: '0.925rem',
        fontWeight: 500,
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={20} style={{ flexShrink: 0 }} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--red)',
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.9rem'
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
