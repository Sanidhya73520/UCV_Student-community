import React from 'react';

export function Card({
  children,
  variant = 'white', // 'white' | 'navy' | 'paper' | 'pink' | 'blue'
  padding = '24px',
  borderRadius = 'var(--radius-lg)',
  style = {},
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'navy':
        return {
          backgroundColor: 'var(--navy)',
          color: 'var(--white)',
          border: 'none'
        };
      case 'paper':
        return {
          backgroundColor: 'var(--paper)',
          color: 'var(--navy)',
          border: '1px solid var(--border)'
        };
      case 'pink':
        return {
          backgroundColor: 'var(--pink-tint)',
          color: 'var(--navy)',
          border: '1px solid rgba(180, 35, 24, 0.15)'
        };
      case 'blue':
        return {
          backgroundColor: 'var(--blue-tint)',
          color: 'var(--navy)',
          border: '1px solid var(--border)'
        };
      case 'white':
      default:
        return {
          backgroundColor: 'var(--white)',
          color: 'var(--navy)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        };
    }
  };

  return (
    <div
      style={{
        borderRadius,
        padding,
        transition: 'box-shadow var(--transition-fast)',
        ...getVariantStyles(),
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
