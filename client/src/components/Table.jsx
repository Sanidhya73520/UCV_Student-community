import React, { useState, useEffect } from 'react';

export function Table({
  columns = [], // [{ key: 'name', label: 'Name', render: (val, row) => ... }]
  data = [],
  keyField = 'id',
  onRowClick = null,
  emptyMessage = 'No records found.'
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  // Mobile: stacked cards
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {data.map((row, index) => {
          const rowKey = row[keyField] || index;
          return (
            <div
              key={rowKey}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: onRowClick ? 'pointer' : 'default',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {columns.map((col) => {
                const val = row[col.key];
                return (
                  <div
                    key={col.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.9rem',
                      padding: '4px 0',
                      borderBottom: '1px solid #F0F2F5'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{col.label}</span>
                    <span style={{ color: 'var(--navy)', textAlign: 'right' }}>
                      {col.render ? col.render(val, row) : val}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop table
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid var(--border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '12px 18px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowKey = row[keyField] || index;
            return (
              <tr
                key={rowKey}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  borderBottom: index < data.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.backgroundColor = 'var(--blue-tint)';
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col) => {
                  const val = row[col.key];
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: '14px 18px',
                        fontSize: '0.925rem',
                        color: 'var(--navy)',
                        verticalAlign: 'middle'
                      }}
                    >
                      {col.render ? col.render(val, row) : val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
