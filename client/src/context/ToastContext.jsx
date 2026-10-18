import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (arg, typeOverride) => {
      let message = '';
      let type = 'info';
      let duration = 4000;
      let action = null;

      if (typeof arg === 'string') {
        message = arg;
        if (typeOverride) type = typeOverride;
      } else if (arg && typeof arg === 'object') {
        message = arg.message || '';
        type = arg.type || typeOverride || 'info';
        duration = arg.duration ?? 4000;
        action = arg.action || null;
      }

      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const newToast = { id, message, type, action };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const contextValue = {
    showToast,
    removeToast,
    show: (arg, type) => showToast(arg, type)
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast overlay */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'var(--navy)',
              color: 'var(--white)',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.95rem',
              animation: 'slideUp 200ms ease'
            }}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  removeToast(toast.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--marigold)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
