import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  {
    id,
    label,
    error,
    helperText,
    options = [],
    placeholder = 'Select an option',
    required = false,
    disabled = false,
    style = {},
    selectStyle = {},
    children,
    ...props
  },
  ref
) {
  const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--navy)'
          }}
        >
          {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        style={{
          minHeight: '44px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: error ? '1.5px solid var(--red)' : '1px solid var(--field-border)',
          backgroundColor: disabled ? 'var(--paper)' : 'var(--white)',
          color: 'var(--navy)',
          fontSize: '0.95rem',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...selectStyle
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
      </select>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: '0.85rem',
            color: 'var(--red)',
            margin: 0
          }}
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          style={{
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            margin: 0
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});
