import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function ClubsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const { isStudent } = useAuth();

  useEffect(() => {
    async function fetchClubs() {
      try {
        const [clubsRes, votesRes] = await Promise.all([
          api.get('/public/clubs'),
          api.get('/public/votes/mine').catch(() => ({ upvotedAreaIds: [] }))
        ]);
        setData(clubsRes);
        setUpvotedIds(new Set(votesRes?.upvotedAreaIds || []));
      } catch (err) {
        console.error('Failed to load clubs data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClubs();
  }, []);

  const handleUpvote = async (areaId) => {
    try {
      const res = await api.post('/public/upvotes/toggle', { clubAreaId: areaId });
      if (res) {
        setUpvotedIds((prev) => {
          const next = new Set(prev);
          if (res.upvoted) next.add(areaId);
          else next.delete(areaId);
          return next;
        });

        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            clubAreas: prev.clubAreas.map((a) =>
              a.id === areaId ? { ...a, upvoteCount: res.upvoteCount } : a
            )
          };
        });
      }
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const clubAreas = data?.clubAreas || [];
  const openClubs = data?.openClubs || [];

  return (
    <div
      className="clubs-page-container"
      style={{
        backgroundColor: '#F2F3F6',
        minHeight: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px 64px'
      }}
    >
      <div
        style={{
          maxWidth: '1328px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        {/* Page Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '900px' }}>
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
            Shape our clubs
          </h1>
          <p style={{ margin: 0, fontSize: '19px', lineHeight: '29px', color: '#2E3650' }}>
            Our clubs don't exist yet, and that's on purpose: they'll be built from what you want. Upvote the activities you'd join, or propose a club of your own.
          </p>
        </div>

        {/* Club Areas Upvote Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height="180px" style={{ borderRadius: '20px' }} />
            ))}
          </div>
        ) : (
          <div
            className="clubs-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '18px'
            }}
          >
            {clubAreas.map((area) => {
              const isUpvoted = upvotedIds.has(area.id);
              return (
                <div
                  key={area.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '26px',
                    borderRadius: '20px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9DDE6',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: '22px',
                        lineHeight: '28px',
                        color: '#18203A'
                      }}
                    >
                      {area.name}
                    </span>
                    <span style={{ fontSize: '16px', lineHeight: '24px', color: '#4A536B' }}>
                      {area.description}
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-label={`Upvote ${area.name}`}
                    aria-pressed={isUpvoted}
                    onClick={() => handleUpvote(area.id)}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      height: '42px',
                      padding: '0 16px',
                      marginTop: '6px',
                      borderRadius: '999px',
                      border: '1.5px solid #1E7B4C',
                      backgroundColor: isUpvoted ? '#1E7B4C' : '#E8F5EE',
                      color: isUpvoted ? '#FFFFFF' : '#17633D',
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <ArrowUp size={16} strokeWidth={2.6} />
                    <span>{area.upvoteCount || 0}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Open Clubs if any */}
        {openClubs.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '30px',
                lineHeight: '36px',
                color: '#18203A'
              }}
            >
              Active clubs
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '18px'
              }}
            >
              {openClubs.map((club) => (
                <div
                  key={club.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '26px',
                    borderRadius: '20px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9DDE6'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '22px',
                      lineHeight: '28px'
                    }}
                  >
                    {club.name}
                  </span>
                  {club.motto && (
                    <span style={{ fontSize: '15px', fontStyle: 'italic', color: '#B42318' }}>
                      {club.motto}
                    </span>
                  )}
                  <p style={{ margin: 0, fontSize: '16px', lineHeight: '24px', color: '#4A536B' }}>
                    {club.description}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#4A536B'
                    }}
                  >
                    <span>{club.frequency || 'Regular meetups'}</span>
                    <span>{club.memberCount} members</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Propose a Club CTA Box */}
        <section
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '32px',
            padding: '32px 36px',
            borderRadius: '22px',
            backgroundColor: '#18203A',
            color: '#FFFFFF',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '28px',
                lineHeight: '34px',
                color: '#FFFFFF'
              }}
            >
              Have an idea for a club?
            </span>
            <span style={{ fontSize: '17px', lineHeight: '25px', color: '#C9D0E4' }}>
              Log in as a student to propose it, and tell us if you'd like to help run it.
            </span>
          </div>

          <Link
            to={isStudent ? '/student/clubs' : '/signin'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '52px',
              padding: '0 24px',
              borderRadius: '12px',
              backgroundColor: '#F2B705',
              color: '#18203A',
              fontWeight: 700,
              fontSize: '16px',
              textDecoration: 'none',
              flexShrink: 0
            }}
          >
            Propose a club
          </Link>
        </section>

        {/* How a club starts (4 steps) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '30px',
              lineHeight: '36px',
              color: '#18203A'
            }}
          >
            How a club starts
          </h2>
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}
          >
            <li
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '22px',
                borderRadius: '18px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9DDE6'
              }}
            >
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#18203A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '16px'
                }}
              >
                1
              </span>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>Upvote</span>
              <span style={{ fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
                Show which activities you'd join. No login needed.
              </span>
            </li>

            <li
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '22px',
                borderRadius: '18px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9DDE6'
              }}
            >
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#18203A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '16px'
                }}
              >
                2
              </span>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>Propose</span>
              <span style={{ fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
                Log in and suggest a club, and say if you'd help run it.
              </span>
            </li>

            <li
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '22px',
                borderRadius: '18px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9DDE6'
              }}
            >
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#18203A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '16px'
                }}
              >
                3
              </span>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>Meet</span>
              <span style={{ fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
                The International Relations Team meets the students who are interested.
              </span>
            </li>

            <li
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '22px',
                borderRadius: '18px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9DDE6'
              }}
            >
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#18203A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '16px'
                }}
              >
                4
              </span>
              <span style={{ fontWeight: 700, fontSize: '18px' }}>Launch</span>
              <span style={{ fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
                The club opens on this page, with its own events.
              </span>
            </li>
          </ol>
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .clubs-page-container {
            padding: 24px 16px 48px !important;
            gap: 20px !important;
          }
          .clubs-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
