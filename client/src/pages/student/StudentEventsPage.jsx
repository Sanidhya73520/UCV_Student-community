import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Calendar } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { broadcastRsvpUpdate } from '../../lib/activitySync.js';

export function StudentEventsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState({});
  const [feedbackOpen, setFeedbackOpen] = useState({});
  const [feedbackDone, setFeedbackDone] = useState({});
  const [rsvpConfirmModal, setRsvpConfirmModal] = useState(null);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await api.get('/me/events');
        setData(res);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const handleRsvp = async (activityId, response) => {
    const act = (data?.upcoming || []).find((a) => a.id === activityId);
    const activityTitle = act?.title || 'this activity';

    try {
      const res = await api.post('/me/rsvp', { activityId, response });
      if (res?.ok) {
        const isGoing = response === 'going';
        setRsvpConfirmModal({
          title: isGoing ? "RSVP Confirmed: You're going!" : "Response Recorded: Can't make it",
          message: isGoing
            ? `You're all set for "${activityTitle}". We've added this event to your plan and notified the coordinator.`
            : `We've recorded that you can't make it to "${activityTitle}". If your plans change, you can switch back to "I'm going" at any time.`,
          isGoing
        });

        toast.show(isGoing ? `RSVP confirmed for "${activityTitle}"!` : `Response updated: Can't make it to "${activityTitle}".`);

        broadcastRsvpUpdate({
          activityId,
          response,
          goingCount: res.goingCount,
          notGoingCount: res.notGoingCount,
          studentName: user?.fullName || 'Student',
          studentCountry: user?.countryCode || '',
          studentFaculty: user?.faculty || ''
        });

        setData((prev) => {
          if (!prev) return prev;
          const updatedUpcoming = prev.upcoming.map((a) =>
            a.id === activityId
              ? { ...a, userRsvp: response, goingCount: res.goingCount, notGoingCount: res.notGoingCount }
              : a
          );
          const actItem = updatedUpcoming.find((a) => a.id === activityId);
          let updatedPlan = prev.plan.filter((p) => p.id !== activityId);
          if (response === 'going' && actItem) {
            updatedPlan = [actItem, ...updatedPlan];
          }
          return {
            ...prev,
            upcoming: updatedUpcoming,
            plan: updatedPlan
          };
        });
      }
    } catch (err) {
      toast.show(err.message || 'Could not update RSVP', 'error');
    }
  };

  const handleSendFeedback = async (activityId) => {
    const rating = selectedRating[activityId];
    if (!rating) return;
    try {
      await api.post('/me/feedback', { activityId, rating });
      setFeedbackDone((prev) => ({ ...prev, [activityId]: true }));
      setFeedbackOpen((prev) => ({ ...prev, [activityId]: false }));
      toast.show('Thanks for your feedback!');
    } catch (err) {
      toast.show(err.message || 'Could not submit feedback', 'error');
    }
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="36px" width="220px" />
        <Skeleton height="200px" style={{ borderRadius: '20px' }} />
      </div>
    );
  }

  const upcoming = data?.upcoming || [];
  const past = data?.past || [];
  const plan = data?.plan || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '36px',
            lineHeight: '42px',
            letterSpacing: '-0.5px',
            color: '#18203A'
          }}
        >
          My events
        </h1>
        <p style={{ margin: 0, fontSize: '17px', color: '#4A536B' }}>
          What's on, and what you're going to.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Column: Upcoming activities */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '22px',
                lineHeight: '28px',
                color: '#18203A'
              }}
            >
              Upcoming activities
            </h2>
            <span style={{ fontSize: '14px', color: '#4A536B' }}>
              Published by the International Relations Department
            </span>
          </div>

          {upcoming.length === 0 ? (
            <div style={{ padding: '32px', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #D9DDE6', textAlign: 'center', color: '#4A536B' }}>
              No upcoming activities right now.
            </div>
          ) : (
            upcoming.map((e) => {
              let mon = 'Upcoming';
              let day = '';
              let whenStr = e.targetMonth ? `In ${e.targetMonth}` : '[Date and time to be confirmed]';
              if (e.date) {
                const d = new Date(e.date);
                mon = d.toLocaleDateString('en-GB', { month: 'short' });
                day = String(d.getDate());
                const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
                whenStr = `${dayName} ${day} ${d.toLocaleDateString('en-GB', { month: 'long' })}${e.startTime ? `, ${e.startTime}` : ''}`;
              }

              return (
                <article
                  key={e.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9DDE6',
                    borderRadius: '20px',
                    padding: '22px',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Date square */}
                  <div
                    style={{
                      width: '72px',
                      height: '80px',
                      flexShrink: 0,
                      borderRadius: '14px',
                      backgroundColor: mon.toLowerCase().includes('oct') ? '#B42318' : '#18203A',
                      color: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{mon}</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '26px', lineHeight: '30px' }}>
                      {day || '—'}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '21px', lineHeight: '26px', color: '#18203A' }}>
                      {e.title}
                    </span>
                    <span style={{ fontSize: '15px', color: '#4A536B' }}>
                      {whenStr}, {e.venue || '[Venue to be confirmed]'}
                    </span>
                    <div style={{ display: 'flex', gap: '14px', paddingTop: '4px', alignItems: 'center' }}>
                      {e.slug && (
                        <Link to={`/activities/${e.slug}`} style={{ fontSize: '14px', fontWeight: 700, color: '#B42318' }}>
                          See itinerary
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* RSVP buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '160px', flexShrink: 0 }}>
                    {e.userRsvp && (
                      <span style={{ fontSize: '12px', color: e.userRsvp === 'going' ? '#17633D' : '#6B7389', fontWeight: 600, textAlign: 'center' }}>
                        {e.userRsvp === 'going' ? "✓ You're going" : "✗ Can't make it"}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-pressed={e.userRsvp === 'going'}
                      onClick={() => handleRsvp(e.id, 'going')}
                      style={{
                        height: '42px',
                        borderRadius: '10px',
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: '2px solid',
                        borderColor: e.userRsvp === 'going' ? '#18203A' : '#C3C9D6',
                        backgroundColor: e.userRsvp === 'going' ? '#18203A' : '#FFFFFF',
                        color: e.userRsvp === 'going' ? '#FFFFFF' : '#18203A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {e.userRsvp === 'going' && <Check size={15} />}
                      I'm going
                    </button>
                    <button
                      type="button"
                      aria-pressed={e.userRsvp === 'not_going'}
                      onClick={() => handleRsvp(e.id, 'not_going')}
                      style={{
                        height: '42px',
                        borderRadius: '10px',
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: '2px solid',
                        borderColor: e.userRsvp === 'not_going' ? '#18203A' : '#C3C9D6',
                        backgroundColor: e.userRsvp === 'not_going' ? '#18203A' : '#FFFFFF',
                        color: e.userRsvp === 'not_going' ? '#FFFFFF' : '#18203A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {e.userRsvp === 'not_going' && <Check size={15} />}
                      Can't make it
                    </button>
                  </div>
                </article>
              );
            })
          )}

          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              border: '2px dashed #B7BFD0',
              fontSize: '15px',
              lineHeight: '22px',
              color: '#4A536B'
            }}
          >
            New activities appear here as soon as the International Relations Department publishes them. You'll also get a notification.
          </div>
        </div>

        {/* Right Column: Sidebar (My plan + Past activities) */}
        <aside style={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* My plan */}
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '20px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '20px',
                lineHeight: '26px',
                color: '#18203A'
              }}
            >
              My plan
            </h2>
            <span style={{ fontSize: '14px', color: '#4A536B' }}>Activities you said yes to</span>

            {plan.length === 0 ? (
              <span style={{ fontSize: '15px', color: '#4A536B' }}>
                Nothing yet. Tap "I'm going" on an activity.
              </span>
            ) : (
              plan.map((p) => {
                let whenStr = p.date
                  ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : p.targetMonth || '';
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: '#F2F3F6'
                    }}
                  >
                    <Check size={18} strokeWidth={2.4} color="#17633D" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#18203A' }}>
                        {p.title}
                      </span>
                      <span style={{ fontSize: '13px', color: '#4A536B' }}>{whenStr}</span>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Past activities */}
          {past.length > 0 && (
            <section
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9DDE6',
                borderRadius: '20px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '20px',
                  lineHeight: '26px',
                  color: '#18203A'
                }}
              >
                Past activities
              </h2>
              {past.map((act) => {
                const isOpen = feedbackOpen[act.id];
                const isDone = feedbackDone[act.id] || act.hasFeedback;
                const rating = selectedRating[act.id] || 0;

                return (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: '#F2F3F6'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#18203A' }}>
                      {act.title}
                    </span>
                    <span style={{ fontSize: '13px', color: '#4A536B' }}>
                      {act.date ? new Date(act.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''}
                    </span>

                    {!isDone && !isOpen && (
                      <button
                        type="button"
                        onClick={() => setFeedbackOpen((prev) => ({ ...prev, [act.id]: true }))}
                        style={{
                          alignSelf: 'flex-start',
                          padding: 0,
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#B42318',
                          fontSize: '14px',
                          fontWeight: 700,
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}
                      >
                        How was it? Give quick feedback
                      </button>
                    )}

                    {isOpen && !isDone && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        <div role="group" aria-label="Rating" style={{ display: 'flex', gap: '6px' }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setSelectedRating((prev) => ({ ...prev, [act.id]: n }))}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                border: '1.5px solid #C3C9D6',
                                backgroundColor: rating === n ? '#18203A' : '#FFFFFF',
                                color: rating === n ? '#FFFFFF' : '#18203A',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendFeedback(act.id)}
                          style={{
                            alignSelf: 'flex-start',
                            height: '36px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#18203A',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          Send
                        </button>
                      </div>
                    )}

                    {isDone && (
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#17633D' }}>
                        Thanks for your feedback!
                      </span>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </aside>
      </div>

      {/* RSVP Confirmation Modal Dialog */}
      {rsvpConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="events-rsvp-dialog-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(24, 32, 58, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setRsvpConfirmModal(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(24, 32, 58, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid #D9DDE6'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: rsvpConfirmModal.isGoing ? '#E8F5EE' : '#F2F3F6',
                  color: rsvpConfirmModal.isGoing ? '#17633D' : '#4A536B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800
                }}
              >
                {rsvpConfirmModal.isGoing ? '✓' : 'ℹ'}
              </div>
              <h3
                id="events-rsvp-dialog-title"
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#18203A'
                }}
              >
                {rsvpConfirmModal.title}
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '15px', lineHeight: '22px', color: '#2E3650' }}>
              {rsvpConfirmModal.message}
            </p>

            <button
              type="button"
              onClick={() => setRsvpConfirmModal(null)}
              style={{
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#18203A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
