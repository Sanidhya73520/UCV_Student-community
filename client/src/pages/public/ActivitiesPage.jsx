import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';

export function ActivitiesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await api.get('/public/activities');
        setData(res);
      } catch (err) {
        console.error('Failed to load activities:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  const upcoming = data?.upcoming || [];
  const earlier = data?.earlier || [];
  const allActivities = [...upcoming, ...earlier];

  const formatActivityDate = (act) => {
    if (act.dateToConfirm || !act.date) {
      return act.targetMonth ? `In ${act.targetMonth}` : '[Date and time to be confirmed]';
    }
    const d = new Date(act.date);
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-GB', { month: 'long' });
    const timeStr = act.startTime ? `, ${act.startTime}` : '';
    return `${dayName} ${dayNum} ${monthName}${timeStr}`;
  };

  const getMonthLabel = (act) => {
    if (act.targetMonth) return act.targetMonth;
    if (act.date) {
      return new Date(act.date).toLocaleDateString('en-GB', { month: 'long' });
    }
    return 'Upcoming';
  };

  const months = ['All', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];

  const filteredActivities = selectedMonth === 'All'
    ? allActivities
    : allActivities.filter((act) => {
        const m = getMonthLabel(act).toLowerCase();
        return m.includes(selectedMonth.toLowerCase());
      });

  return (
    <div
      className="activities-page-container"
      style={{
        backgroundColor: '#F2F3F6',
        minHeight: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 64px 64px'
      }}
    >
      <div
        style={{
          maxWidth: '1328px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}
      >
        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(36px, 4vw, 52px)',
              lineHeight: 1.1,
              letterSpacing: '-1px',
              color: '#18203A'
            }}
          >
            Activity calendar
          </h1>
          <p style={{ margin: 0, fontSize: '18px', lineHeight: '27px', color: '#2E3650' }}>
            Activities organised by the International Relations Department, one every month from October to June. Everything is free or almost free.
          </p>
        </div>

        {/* Month Filter Chips (M9) */}
        <div className="horizontal-scroll-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
          {months.map((m) => {
            const isSelected = selectedMonth === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '40px',
                  padding: '0 18px',
                  borderRadius: '999px',
                  border: isSelected ? '1.5px solid var(--navy)' : '1.5px solid #D9DDE6',
                  backgroundColor: isSelected ? 'var(--navy)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#18203A',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 150ms ease'
                }}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height="220px" style={{ borderRadius: '20px' }} />
            ))}
          </div>
        ) : (
          <div
            className="activities-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '20px'
            }}
          >
            {filteredActivities.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '48px 24px',
                  textAlign: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  color: '#4A536B'
                }}
              >
                No activities found for {selectedMonth}.
              </div>
            ) : (
              filteredActivities.map((act) => {
                const month = getMonthLabel(act);
                const isHighlight = month.toLowerCase().includes('october') || act.slug === 'welcome-evening';
                const hasDetailedPage = Boolean(act.slug);

                return (
                  <article
                    key={act.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '24px',
                      borderRadius: '20px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9DDE6',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 800,
                            fontSize: '22px',
                            color: isHighlight ? '#B42318' : '#18203A'
                          }}
                        >
                          {month}
                        </span>
                      </div>

                      <h2
                        style={{
                          margin: 0,
                          fontSize: '20px',
                          lineHeight: '26px',
                          fontWeight: 700,
                          color: '#18203A'
                        }}
                      >
                        {act.title}
                      </h2>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '15px',
                          lineHeight: '21px',
                          color: '#4A536B'
                        }}
                      >
                        <span>{formatActivityDate(act)}</span>
                        <span>{act.venue || '[Venue to be confirmed]'}</span>
                        <span style={{ textTransform: 'capitalize' }}>
                          {act.costChoice === 'free' ? 'Free' : act.costChoice}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      {hasDetailedPage ? (
                        <Link
                          to={`/activities/${act.slug}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: '1.5px solid #18203A',
                            color: '#18203A',
                            fontWeight: 700,
                            fontSize: '15px',
                            textDecoration: 'none',
                            transition: 'all 150ms ease'
                          }}
                        >
                          Details and itinerary
                        </Link>
                      ) : (
                        <span style={{ fontSize: '15px', fontStyle: 'italic', color: '#4A536B' }}>
                          Details coming soon
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .activities-page-container {
            padding: 24px 16px 48px !important;
            gap: 20px !important;
          }
          .activities-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
