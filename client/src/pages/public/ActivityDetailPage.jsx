import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Gift,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { broadcastRsvpUpdate } from '../../lib/activitySync.js';

export function ActivityDetailPage() {
  const { slug } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState(null); // 'going', 'not_going', or null
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const { isStudent, user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await api.get(`/public/activities/${slug}`);
        setActivity(res.activity);
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [slug]);

  // Check if student has RSVP'd (if student is logged in)
  useEffect(() => {
    if (isStudent && activity?.id) {
      api.get(`/me/rsvp/${activity.id}`)
        .then((res) => {
          if (res?.response) setRsvpStatus(res.response);
        })
        .catch(() => {});
    }
  }, [isStudent, activity?.id]);

  const handleRsvp = async (response) => {
    if (!isStudent || !activity?.id) return;
    setSubmittingRsvp(true);
    try {
      const res = await api.post('/me/rsvp', {
        activityId: activity.id,
        response
      });
      setRsvpStatus(response);
      toast.show(response === 'going' ? "RSVP confirmed! See you there." : "RSVP updated.");
      setActivity((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          goingCount: res?.goingCount ?? (response === 'going' ? (prev.goingCount || 0) + 1 : Math.max(0, (prev.goingCount || 0) - 1)),
          notGoingCount: res?.notGoingCount ?? (response === 'not_going' ? (prev.notGoingCount || 0) + 1 : Math.max(0, (prev.notGoingCount || 0) - 1))
        };
      });

      broadcastRsvpUpdate({
        activityId: activity.id,
        response,
        goingCount: res?.goingCount,
        notGoingCount: res?.notGoingCount,
        studentName: user?.fullName || 'Student',
        studentCountry: user?.countryCode || '',
        studentFaculty: user?.faculty || ''
      });
    } catch (err) {
      toast.show(err.message || 'Could not update RSVP', 'error');
    } finally {
      setSubmittingRsvp(false);
    }
  };


  if (loading) {
    return (
      <div style={{ padding: '40px 56px', maxWidth: '1328px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Skeleton height="32px" width="160px" />
        <Skeleton height="300px" style={{ borderRadius: '28px' }} />
        <Skeleton height="200px" style={{ borderRadius: '24px' }} />
      </div>
    );
  }

  if (!activity) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Activity not found</h2>
        <Link to="/activities" style={{ color: 'var(--cherry)', fontWeight: 700 }}>
          Back to calendar
        </Link>
      </div>
    );
  }

  const formattedDate = activity.date
    ? new Date(activity.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    : activity.targetMonth
    ? `In ${activity.targetMonth}`
    : 'Date to be confirmed';

  const formattedTime =
    activity.startTime && activity.endTime
      ? `${activity.startTime} to ${activity.endTime}`
      : activity.startTime || 'Time to be confirmed';

  return (
    <div
      className="activity-detail-container"
      style={{
        backgroundColor: '#F2F3F6',
        minHeight: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 56px 56px'
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
        {/* Back link */}
        <Link
          to="/activities"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '44px',
            fontWeight: 700,
            fontSize: '15px',
            color: '#B42318',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
          Back to the calendar
        </Link>

        {/* Hero Section: Left details + Right Quote card */}
        <section
          style={{
            display: 'flex',
            gap: '28px',
            alignItems: 'stretch',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              flex: '1 1 600px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              padding: '40px',
              borderRadius: '28px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6'
            }}
          >
            <span
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                height: '32px',
                padding: '0 14px',
                borderRadius: '999px',
                backgroundColor: '#FBEAE8',
                color: '#8F1B12',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              {activity.targetMonth ? `${activity.targetMonth} event` : 'Upcoming event'}
            </span>

            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(36px, 4vw, 56px)',
                lineHeight: 1.1,
                letterSpacing: '-1.5px',
                color: '#18203A'
              }}
            >
              {activity.title}
            </h1>

            <p style={{ margin: 0, maxWidth: '640px', fontSize: '20px', lineHeight: '30px', color: '#2E3650' }}>
              {activity.description}
            </p>

            {/* 4 Info Tiles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginTop: '6px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#F2F3F6'
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#18203A'
                  }}
                >
                  <Calendar size={20} strokeWidth={2} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', color: '#4A536B' }}>Date</span>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#18203A' }}>
                    {formattedDate}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#F2F3F6'
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#18203A'
                  }}
                >
                  <Clock size={20} strokeWidth={2} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', color: '#4A536B' }}>Time</span>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#18203A' }}>
                    {formattedTime}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#F2F3F6'
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#18203A'
                  }}
                >
                  <MapPin size={20} strokeWidth={2} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', color: '#4A536B' }}>Place</span>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#18203A' }}>
                    {activity.venue || '[Venue to be confirmed]'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#F2F3F6'
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#18203A'
                  }}
                >
                  <Tag size={20} strokeWidth={2} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', color: '#4A536B' }}>Cost</span>
                  <span style={{ fontWeight: 700, fontSize: '15px', textTransform: 'capitalize', color: '#18203A' }}>
                    {activity.costChoice === 'free' ? 'Free' : activity.costChoice}
                  </span>
                </div>
              </div>
            </div>

            {/* RSVP / Join Callout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid #E8ECF2'
              }}
            >
              {isStudent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#18203A' }}>
                    Are you coming?
                  </span>
                  <button
                    type="button"
                    disabled={submittingRsvp}
                    onClick={() => handleRsvp('going')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      height: '42px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #1E7B4C',
                      backgroundColor: rsvpStatus === 'going' ? '#1E7B4C' : '#E8F5EE',
                      color: rsvpStatus === 'going' ? '#FFFFFF' : '#17633D',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle size={16} />
                    I'm going {activity.goingCount ? `(${activity.goingCount})` : ''}
                  </button>
                  <button
                    type="button"
                    disabled={submittingRsvp}
                    onClick={() => handleRsvp('not_going')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      height: '42px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #D9DDE6',
                      backgroundColor: rsvpStatus === 'not_going' ? '#4A536B' : '#F2F3F6',
                      color: rsvpStatus === 'not_going' ? '#FFFFFF' : '#4A536B',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={16} />
                    Can't make it
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '16px', lineHeight: '24px', color: '#4A536B' }}>
                  Coming?{' '}
                  <Link to="/signin" style={{ fontWeight: 700, color: '#B42318' }}>
                    Log in as a student
                  </Link>{' '}
                  to let us know.
                </span>
              )}
            </div>
          </div>

          {/* Right Quote card */}
          <aside
            style={{
              flex: '0 0 380px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              padding: '36px',
              borderRadius: '28px',
              backgroundColor: '#18203A',
              color: '#FFFFFF'
            }}
          >
            <span
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#F2B705',
                color: '#18203A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Gift size={28} strokeWidth={2} />
            </span>

            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '26px',
                lineHeight: '34px',
                color: '#FFFFFF'
              }}
            >
              {activity.quote || "The most important thing isn't in the welcome bag. It's the people you're about to meet."}
            </p>

            <span style={{ fontSize: '15px', color: '#C9D0E4' }}>
              {activity.quoteSource || 'From your welcome card'}
            </span>
          </aside>
        </section>

        {/* Itinerary Timeline */}
        {activity.itinerary && activity.itinerary.length > 0 && (
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              padding: '32px 36px',
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '32px',
                  lineHeight: '38px',
                  color: '#18203A'
                }}
              >
                Itinerary
              </h2>
              <span style={{ fontSize: '15px', color: '#4A536B' }}>Times to be confirmed</span>
            </div>

            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {activity.itinerary.map((step, idx) => {
                const isLast = idx === activity.itinerary.length - 1;
                return (
                  <li
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 18px minmax(0, 1fr)',
                      gap: '18px',
                      alignItems: 'start'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '22px',
                        lineHeight: '28px',
                        color: '#B42318'
                      }}
                    >
                      {step.time}
                    </span>
                    <span style={{ position: 'relative', height: '100%' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '6px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: '#F2B705',
                          border: '3px solid #FFFFFF',
                          boxShadow: '0 0 0 1.5px #C49A54'
                        }}
                      />
                      {!isLast && (
                        <span
                          style={{
                            position: 'absolute',
                            left: '7px',
                            top: '22px',
                            bottom: '-22px',
                            width: '2px',
                            backgroundColor: '#E6D3A8'
                          }}
                        />
                      )}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '18px', lineHeight: '26px', color: '#18203A' }}>
                        {step.title}
                      </span>
                      {step.detail && (
                        <span style={{ fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
                          {step.detail}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* 2-Column: What to bring & Good to know */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '28px',
              borderRadius: '22px',
              backgroundColor: '#FDF3D3'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '24px',
                lineHeight: '30px',
                color: '#18203A'
              }}
            >
              What to bring
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#2E3650'
              }}
            >
              {(activity.whatToBring && activity.whatToBring.length > 0
                ? activity.whatToBring
                : [
                    'Your phone, to join the community on the spot',
                    'A friend who is new in Craiova',
                    'Optional: something small from home to show others'
                  ]
              ).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '28px',
              borderRadius: '22px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '24px',
                lineHeight: '30px',
                color: '#18203A'
              }}
            >
              Good to know
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '17px',
                lineHeight: '25px',
                color: '#2E3650'
              }}
            >
              {(activity.goodToKnow && activity.goodToKnow.length > 0
                ? activity.goodToKnow
                : [
                    'Open to all international students; Romanian students are welcome too',
                    'The evening is in English',
                    'Questions? Write to the International Relations Department'
                  ]
              ).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .activity-detail-container {
            padding: 20px 16px 48px !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
