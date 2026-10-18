import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextField } from './TextField.jsx';

export const PasswordField = forwardRef(function PasswordField(
  { rightElement, ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <TextField
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightElement={rightElement}
        inputStyle={{ paddingRight: '44px' }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={0}
        style={{
          position: 'absolute',
          right: '12px',
          bottom: props.error || props.helperText ? '28px' : '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px'
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
});
