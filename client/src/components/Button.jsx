import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = null,
  disabled = false,
  type = 'button',
  onClick,
  fullWidth = false,
  style = {},
  icon = null,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--red)',
          color: 'var(--white)',
          border: 'none',
          boxShadow: 'var(--shadow-sm)'
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--white)',
          color: 'var(--navy)',
          border: '1px solid var(--border)'
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--red)',
          border: '1.5px solid var(--red)'
        };
      case 'success':
        return {
          backgroundColor: 'var(--green)',
          color: 'var(--white)',
          border: 'none'
        };
      case 'navy':
        return {
          backgroundColor: 'var(--navy)',
          color: 'var(--white)',
          border: 'none'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--navy)',
          border: 'none'
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          minHeight: '38px',
          padding: '6px 14px',
          fontSize: '0.875rem'
        };
      case 'lg':
        return {
          minHeight: '50px',
          padding: '12px 28px',
          fontSize: '1.05rem'
        };
      case 'md':
      default:
        return {
          minHeight: '44px',
          padding: '10px 20px',
          fontSize: '0.95rem'
        };
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        borderRadius: 'var(--radius-md)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.65 : 1,
        transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
        width: fullWidth ? '100%' : 'auto',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 600ms linear infinite'
            }}
          />
          <span>{loadingText || 'Please wait…'}</span>
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
