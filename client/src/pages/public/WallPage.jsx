import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, MessageSquare, MapPin, Sparkles, ArrowRight, Quote, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatWallDate } from '../../lib/dateUtils.js';
import { useWallSync } from '../../lib/wallSync.js';

export function WallPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meTooIds, setMeTooIds] = useState(new Set());
  const [wallUpvoteColor, setWallUpvoteColor] = useState('#1E7B4C');
  const { isStudent } = useAuth();

  const fetchWall = async () => {
    try {
      const [wallRes, votesRes] = await Promise.all([
        api.get('/public/wall'),
        api.get('/public/votes/mine').catch(() => ({ meTooPostIds: [] }))
      ]);
      setData(wallRes);
      if (wallRes?.wallUpvoteColor) {
        setWallUpvoteColor(wallRes.wallUpvoteColor);
      }
      setMeTooIds(new Set(votesRes?.meTooPostIds || []));
    } catch (err) {
      console.error('Failed to load wall:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWall();
  }, []);

  useWallSync({
    onUpdate: (evt) => {
      if (evt?.wallUpvoteColor) {
        setWallUpvoteColor(evt.wallUpvoteColor);
      }
      if (evt?.action === 'meToo' && evt?.postId) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            answers: prev.answers.map((a) =>
              a.id === evt.postId ? { ...a, meTooCount: evt.meTooCount } : a
            )
          };
        });
      } else {
        fetchWall();
      }
    },
    onRefresh: fetchWall
  });

  const pendingMeTooRef = useRef(new Set());
  const [pendingMeTooIds, setPendingMeTooIds] = useState(new Set());

  const handleToggleMeToo = async (postId) => {

    if (pendingMeTooRef.current.has(postId)) return;
    pendingMeTooRef.current.add(postId);
    setPendingMeTooIds((prev) => new Set(prev).add(postId));

    try {
      const res = await api.post('/public/me-too/toggle', { wallPostId: postId });
      if (res) {
        setMeTooIds((prev) => {
          const next = new Set(prev);
          if (res.meToo) next.add(postId);
          else next.delete(postId);
          return next;
        });

        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            answers: prev.answers.map((a) =>
              a.id === postId ? { ...a, meTooCount: res.meTooCount } : a
            )
          };
        });
      }
    } catch (err) {
      console.error('Me too failed:', err);
    }finally{
      pendingMeTooRef.current.delete(postId);
      setPendingMeTooIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }

  };

  const currentQuestion = data?.currentQuestion;
  const answers = data?.answers || [];
  const allQuestions = data?.allQuestions || [];

  const avatarTints = [
    { bg: '#FBEAE8', text: '#B42318' },
    { bg: '#E4E9F4', text: '#18203A' },
    { bg: '#FEF3D6', text: '#92400E' },
    { bg: '#E8F5EE', text: '#17633D' },
    { bg: '#F3E8FF', text: '#6D28D9' },
    { bg: '#E0F2FE', text: '#0369A1' }
  ];

  return (
    <div
      className="wall-page-container"
      style={{
        background: 'linear-gradient(180deg, #F8FAFD 0%, #F1F4F9 100%)',
        minHeight: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 32px 72px'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px'
        }}
      >
        {/* Page Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '820px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#FBEAE8',
              border: '1px solid rgba(180, 35, 24, 0.2)',
              alignSelf: 'flex-start'
            }}
          >
            <MessageSquare size={14} color="var(--red)" />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--red)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              COMMUNITY VOICES & STORIES
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(36px, 4.2vw, 50px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              color: 'var(--navy)'
            }}
          >
            International Wall
          </h1>
          <p style={{ margin: 0, fontSize: '18px', lineHeight: '28px', color: 'var(--text-muted)' }}>
            One question every month. Throughout the semester, student answers come together to tell the shared story of our community in Craiova.
          </p>
        </div>

        {/* Current Question Showcase Card */}
        {loading ? (
          <Skeleton height="260px" style={{ borderRadius: '24px' }} />
        ) : currentQuestion ? (
          <section
            className="wall-question-card"
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '36px',
              padding: '42px 40px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #18203A 0%, #1E284A 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -10px rgba(24, 32, 58, 0.18)',
              color: '#FFFFFF',
              flexWrap: 'wrap',
              overflow: 'hidden'
            }}
          >
            {/* Ambient Background Accent */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(242, 183, 5, 0.12) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />

            {/* Left: Question Content & Publication Date */}
            <div className="wall-question-left" style={{ flex: '1 1 520px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Published Date in DD Month YYYY format */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(242, 183, 5, 0.16)',
                    border: '1px solid rgba(242, 183, 5, 0.35)',
                    color: '#F2B705',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.02em'
                  }}
                >
                  <Calendar size={14} />
                  <span>
                    {currentQuestion.createdAt
                      ? `Published on ${formatWallDate(currentQuestion.createdAt)}`
                      : 'Active monthly prompt'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(74, 222, 128, 0.15)',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                    color: '#4ADE80',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#4ADE80'
                    }}
                  />
                  <span>Answers now open</span>
                </div>
              </div>

              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: 'clamp(26px, 3.2vw, 38px)',
                  lineHeight: 1.22,
                  letterSpacing: '-0.8px',
                  color: '#FFFFFF'
                }}
              >
                {currentQuestion.question}
              </h2>
            </div>

            {/* Right: Submission Action Box */}
            <div
              className="wall-question-action-box"
              style={{
                width: '380px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '26px 28px',
                borderRadius: '18px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(8px)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '20px',
                  lineHeight: '26px',
                  color: '#FFFFFF'
                }}
              >
                Want to add your answer?
              </span>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#D9DDE6' }}>
                Join the conversation! Post your perspective as a verified student. Our team reviews all answers before they appear on the public wall.
              </p>

              <Link
                to={isStudent ? '/student/wall' : '/signin'}
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '46px',
                  padding: '0 22px',
                  marginTop: '4px',
                  borderRadius: '10px',
                  backgroundColor: '#F2B705',
                  color: '#18203A',
                  fontWeight: 800,
                  fontSize: '15px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(242, 183, 5, 0.3)',
                  transition: 'all 160ms ease'
                }}
              >
                <span>{isStudent ? 'Write your answer' : 'Student login to answer'}</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
            </div>
          </section>
        ) : null}

        {/* Answers List Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '26px',
                  lineHeight: '32px',
                  color: 'var(--navy)'
                }}
              >
                What our members said
              </h2>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Real voices from students at the University of Craiova
              </span>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: '32px',
                padding: '0 14px',
                borderRadius: '999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9DDE6',
                color: 'var(--navy)',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 1px 3px rgba(24, 32, 58, 0.04)'
              }}
            >
              {answers.length} {answers.length === 1 ? 'verified answer' : 'verified answers'}
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="200px" style={{ borderRadius: '18px' }} />
              ))}
            </div>
          ) : answers.length === 0 ? (
            <div
              style={{
                padding: '56px 28px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1.5px dashed #D9DDE6',
                boxShadow: '0 2px 10px rgba(24, 32, 58, 0.03)',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <MessageSquare size={36} color="#94A3B8" />
              <strong style={{ fontSize: '18px', color: 'var(--navy)' }}>No answers posted yet for this prompt</strong>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748B', maxWidth: '420px' }}>
                Be the first to share your thoughts and have your voice featured on the UCV community wall.
              </p>
              <Link
                to={isStudent ? '/student/wall' : '/signin'}
                style={{
                  marginTop: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--red)',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                <span>Add the first answer</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div
              className="wall-answers-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '20px'
              }}
            >
              {answers.map((a, idx) => {
                const isMeToo = meTooIds.has(a.id);
                const tint = avatarTints[idx % avatarTints.length];
                const initial = a.user?.firstName ? a.user.firstName.charAt(0).toUpperCase() : '?';

                return (
                  <article
                    key={a.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      padding: '24px 24px 20px',
                      borderRadius: '18px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E6EE',
                      boxShadow: '0 2px 8px rgba(24, 32, 58, 0.04)',
                      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Top: Avatar, Name, Country & Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              backgroundColor: tint.bg,
                              color: tint.text,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '17px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                            }}
                          >
                            {initial}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--navy)' }}>
                              {a.user?.firstName || 'Student'}
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '13px',
                                color: '#64748B',
                                fontWeight: 600
                              }}
                            >
                              <MapPin size={12} color="#94A3B8" />
                              {a.user?.countryName || 'International Student'}
                            </span>
                          </div>
                        </div>

                        {/* Submission Date formatted DD Month YYYY */}
                        {a.createdAt && (
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#94A3B8',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {formatWallDate(a.createdAt)}
                          </span>
                        )}
                      </div>

                      {/* Answer Body in Speech/Quote Style */}
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E8EBF2',
                          position: 'relative'
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '16px', lineHeight: '24px', color: '#1E293B' }}>
                          "{a.text}"
                        </p>
                      </div>
                    </div>

                    {/* Footer: Me Too Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F4F9', paddingTop: '12px' }}>
                      <button
                        type="button"
                        aria-pressed={isMeToo}
                        onClick={() => handleToggleMeToo(a.id)}
                        disabled={pendingMeTooIds.has(a.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          height: '38px',
                          padding: '0 16px',
                          borderRadius: '999px',
                          border: isMeToo ? `1.5px solid ${wallUpvoteColor || '#1E7B4C'}` : '1.5px solid #CBD5E1',
                          backgroundColor: isMeToo ? '#E8F5EE' : '#FFFFFF',
                          color: isMeToo ? '#17633D' : 'var(--navy)',
                          fontFamily: 'inherit',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 160ms ease'
                        }}
                      >
                        <Heart size={16} fill={isMeToo ? (wallUpvoteColor || '#1E7B4C') : 'none'} color={isMeToo ? (wallUpvoteColor || '#1E7B4C') : 'currentColor'} />
                        <span>
                          Me too {a.meTooCount ? <strong style={{ marginLeft: '2px' }}>({a.meTooCount})</strong> : ''}
                        </span>
                      </button>

                      <span style={{ fontSize: '12px', color: isMeToo ? '#17633D' : '#94A3B8', fontWeight: 600 }}>
                        {isMeToo ? '✓ You agreed' : 'Tap if you agree'}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {answers.length > 0 && (
            <button
              type="button"
              className="wall-show-more-btn"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                border: '1.5px solid #D9DDE6',
                backgroundColor: '#FFFFFF',
                color: 'var(--navy)',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(24, 32, 58, 0.04)'
              }}
            >
              Show more
            </button>
          )}
        </section>

        {/* This Year's Questions (Archive Section) */}
        {allQuestions.length > 0 && (
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              marginTop: '16px',
              borderTop: '1px solid #E2E6EE',
              paddingTop: '36px'
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '24px',
                  lineHeight: '30px',
                  color: 'var(--navy)'
                }}
              >
                This academic year's questions
              </h2>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Each monthly question builds our annual international student anthology
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '16px'
              }}
            >
              {allQuestions.map((q) => {
                const isOpen = q.status === 'Now open';
                return (
                  <div
                    key={q.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '22px 20px',
                      borderRadius: '16px',
                      backgroundColor: isOpen ? '#18203A' : '#FFFFFF',
                      color: isOpen ? '#FFFFFF' : 'var(--navy)',
                      border: isOpen ? '1px solid #18203A' : '1px solid #E2E6EE',
                      boxShadow: '0 2px 6px rgba(24, 32, 58, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '13px',
                            color: isOpen ? '#F2B705' : '#64748B'
                          }}
                        >
                          {q.createdAt ? formatWallDate(q.createdAt) : q.month || 'Prompt'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            backgroundColor: isOpen ? 'rgba(74, 222, 128, 0.2)' : '#F1F4F9',
                            color: isOpen ? '#4ADE80' : '#475569',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {q.status}
                        </span>
                      </div>

                      <span
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          fontSize: '17px',
                          lineHeight: '23px',
                          color: isOpen ? '#FFFFFF' : 'var(--navy)'
                        }}
                      >
                        {q.question}
                      </span>
                    </div>

                    <span style={{ fontSize: '12px', color: isOpen ? '#A0AEC0' : '#94A3B8', fontWeight: 600 }}>
                      {isOpen ? 'Currently accepting answers' : 'Archived question'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .wall-page-container {
            padding: 24px 16px 48px !important;
            gap: 24px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .wall-question-card {
            padding: 24px 18px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 20px !important;
            border-radius: 20px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .wall-question-left {
            flex: none !important;
            width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .wall-question-action-box {
            width: 100% !important;
            max-width: 100% !important;
            flex-shrink: 1 !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            backdrop-filter: none !important;
            box-sizing: border-box !important;
          }
          .wall-question-action-box a {
            width: 100% !important;
            justify-content: center !important;
            height: 48px !important;
            box-sizing: border-box !important;
          }
          .wall-answers-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
