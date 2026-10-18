import React from 'react';

export function Badge({
  status,
  label = null,
  size = 'md',
  dot = false,
  style = {}
}) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'pending':
      case 'waiting':
        return {
          bg: '#FEF3D6',
          color: '#8F6400',
          text: label || (status === 'pending' ? 'Pending' : 'Waiting'),
          dotColor: 'var(--marigold)'
        };
      case 'approved':
      case 'published':
      case 'answered':
      case 'ready':
      case 'going':
        return {
          bg: '#E6F4EA',
          color: 'var(--green)',
          text: label || (status === 'approved' ? 'Approved' : status === 'published' ? 'Published' : status === 'going' ? 'Going' : 'Answered'),
          dotColor: 'var(--green)'
        };
      case 'rejected':
      case 'not_going':
      case 'removed':
        return {
          bg: 'var(--pink-tint)',
          color: 'var(--red)',
          text: label || (status === 'rejected' ? 'Rejected' : status === 'not_going' ? "Can't make it" : 'Removed'),
          dotColor: 'var(--red)'
        };
      case 'live_now':
        return {
          bg: 'var(--pink-tint)',
          color: 'var(--red)',
          text: label || 'Live now',
          dotColor: 'var(--red)'
        };
      case 'planning':
      case 'draft':
      case 'hidden':
      case 'done':
        return {
          bg: '#E9ECEF',
          color: 'var(--text-muted)',
          text: label || (status === 'planning' ? 'Planning' : status === 'draft' ? 'Draft' : status === 'hidden' ? 'Hidden' : 'Done'),
          dotColor: 'var(--text-muted)'
        };
      case 'date_to_confirm':
        return {
          bg: '#FEF3D6',
          color: '#8F6400',
          text: label || 'Date to confirm',
          dotColor: 'var(--marigold)'
        };
      case 'navy':
        return {
          bg: 'var(--navy)',
          color: 'var(--white)',
          text: label || '',
          dotColor: null
        };
      default:
        return {
          bg: 'var(--paper)',
          color: 'var(--text)',
          text: label || status,
          dotColor: null
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-pill)',
        fontSize: size === 'sm' ? '0.75rem' : '0.825rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {(dot || config.dotColor) && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: config.dotColor || config.color,
            display: 'inline-block'
          }}
        />
      )}
      {config.text}
    </span>
  );
}
