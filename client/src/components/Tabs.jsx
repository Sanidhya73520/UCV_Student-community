import React from 'react';

export function Tabs({
  tabs = [], // [{ id: 'pending', label: 'Pending', count: 3 }]
  activeTab,
  onChange,
  style = {}
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'var(--paper)',
        padding: '4px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border)',
        ...style
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              backgroundColor: isActive ? 'var(--navy)' : 'transparent',
              color: isActive ? 'var(--white)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast), color var(--transition-fast)',
              outline: 'none',
              minHeight: '36px'
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--border)',
                  color: isActive ? 'var(--white)' : 'var(--navy)'
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
