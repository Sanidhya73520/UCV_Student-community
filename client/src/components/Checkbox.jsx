import React, { forwardRef } from 'react';

export const Checkbox = forwardRef(function Checkbox(
  {
    id,
    label,
    error,
    checked = false,
    onChange,
    disabled = false,
    style = {},
    ...props
  },
  ref
) {
  const checkId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }}>
      <label
        htmlFor={checkId}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.925rem',
          color: 'var(--navy)',
          userSelect: 'none',
          lineHeight: 1.4
        }}
      >
        <input
          ref={ref}
          id={checkId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: '20px',
            height: '20px',
            marginTop: '2px',
            accentColor: 'var(--navy)',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          {...props}
        />
        <span>{label}</span>
      </label>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: '0.85rem',
            color: 'var(--red)',
            margin: '2px 0 0 32px'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
});
