import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Download,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { useActivitySync } from '../../lib/activitySync.js';

export function StaffActivitiesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActivities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.get('/staff/activities');
      const list = res.activities || [];
      setActivities(list);

      if (list.length > 0) {
        if (!selectedActivity) {
          setSelectedActivity(list[0]);
        } else {
          const updated = list.find((a) => a.id === selectedActivity.id);
          setSelectedActivity(updated || list[0]);
        }
      } else {
        setSelectedActivity(null);
      }
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load activities.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useActivitySync({
    onUpdate: (update) => {
      if (update?.activityId) {
        setActivities((prevList) =>
          prevList.map((a) => {
            if (a.id === update.activityId) {
              let updatedResponses = a.responses || [];
              if (update.studentName) {
                const existingIdx = updatedResponses.findIndex(
                  (r) =>
                    (r.email && update.studentEmail && r.email.toLowerCase() === update.studentEmail.toLowerCase()) ||
                    r.fullName === update.studentName
                );
                const newEntry = {
                  fullName: update.studentName,
                  firstName: update.studentFirstName || update.studentName.split(' ')[0],
                  countryCode: update.studentCountry || '',
                  countryName: update.studentCountry || '',
                  faculty: update.studentFaculty || '',
                  email: update.studentEmail || '',
                  answer: update.response,
                  timestamp: update.timestamp || new Date()
                };
                if (existingIdx >= 0) {
                  updatedResponses = [
                    ...updatedResponses.slice(0, existingIdx),
                    { ...updatedResponses[existingIdx], ...newEntry },
                    ...updatedResponses.slice(existingIdx + 1)
                  ];
                } else {
                  updatedResponses = [newEntry, ...updatedResponses];
                }
              }
              return {
                ...a,
                goingCount: update.goingCount !== undefined ? update.goingCount : a.goingCount,
                notGoingCount: update.notGoingCount !== undefined ? update.notGoingCount : a.notGoingCount,
                responses: updatedResponses
              };
            }
            return a;
          })
        );

        setSelectedActivity((prev) => {
          if (!prev || prev.id !== update.activityId) return prev;
          let updatedResponses = prev.responses || [];
          if (update.studentName) {
            const existingIdx = updatedResponses.findIndex(
              (r) =>
                (r.email && update.studentEmail && r.email.toLowerCase() === update.studentEmail.toLowerCase()) ||
                r.fullName === update.studentName
            );
            const newEntry = {
              fullName: update.studentName,
              firstName: update.studentFirstName || update.studentName.split(' ')[0],
              countryCode: update.studentCountry || '',
              countryName: update.studentCountry || '',
              faculty: update.studentFaculty || '',
              email: update.studentEmail || '',
              answer: update.response,
              timestamp: update.timestamp || new Date()
            };
            if (existingIdx >= 0) {
              updatedResponses = [
                ...updatedResponses.slice(0, existingIdx),
                { ...updatedResponses[existingIdx], ...newEntry },
                ...updatedResponses.slice(existingIdx + 1)
              ];
            } else {
              updatedResponses = [newEntry, ...updatedResponses];
            }
          }
          return {
            ...prev,
            goingCount: update.goingCount !== undefined ? update.goingCount : prev.goingCount,
            notGoingCount: update.notGoingCount !== undefined ? update.notGoingCount : prev.notGoingCount,
            responses: updatedResponses
          };
        });
      }
    },
    onFallbackRefresh: () => {
      fetchActivities(true);
    }
  });

  const handlePublish = async (activityId) => {
    try {
      setActionLoading(true);
      await api.post(`/staff/activities/${activityId}/publish`);
      showToast({ message: 'Activity published to public website.', type: 'success' });
      fetchActivities();
    } catch (err) {
      showToast({ message: err.message || 'Failed to publish activity.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleHide = async (activityId) => {
    try {
      setActionLoading(true);
      await api.post(`/staff/activities/${activityId}/hide`);
      showToast({ message: 'Activity hidden from public view.', type: 'info' });
      fetchActivities();
    } catch (err) {
      showToast({ message: err.message || 'Failed to hide activity.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportRsvps = async (activityId, title) => {
    try {
      showToast({ message: 'Downloading RSVPs list...', type: 'info' });
      const blob = await api.download(`/staff/activities/${activityId}/export`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rsvps-${activityId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast({ message: 'RSVP list exported.', type: 'success' });
    } catch (err) {
      showToast({ message: err.message || 'Export failed.', type: 'error' });
    }
  };

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800 }}>
            Activities
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
            Plan, publish and see who is going.
          </p>
        </div>

        <Link
          to="/staff/activities/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '44px',
            padding: '0 18px',
            borderRadius: '10px',
            backgroundColor: 'var(--brand-red)',
            color: 'var(--white)',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none'
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          New activity
        </Link>
      </header>

      {error && <ErrorAlert message={error} onRetry={fetchActivities} />}

      {/* Main Layout: Timeline Sidebar + Detail Area */}
      <div className="staff-activities-grid">
        {/* Left Sidebar: Timeline of Activities */}
        <section
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <h2 style={{ margin: '0 8px 6px', fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700 }}>
            This year
          </h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
              <Skeleton height="60px" />
              <Skeleton height="60px" />
              <Skeleton height="60px" />
            </div>
          ) : activities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activities.map((act) => {
                const isSelected = selectedActivity?.id === act.id;
                const isPublished = act.status === 'published';
                const isDateConfirm = act.dateToConfirm;
                const isPlanning = act.status === 'draft' || act.status === 'planning';

                let badgeLabel = 'Planning';
                let badgeBg = '#EEF0F4';
                let badgeColor = '#4A536B';

                if (isDateConfirm) {
                  badgeLabel = 'Date to confirm';
                  badgeBg = '#FDF3D3';
                  badgeColor = '#5C4A00';
                } else if (isPublished) {
                  badgeLabel = 'Published';
                  badgeBg = '#E8F5EE';
                  badgeColor = '#17633D';
                }

                const monthName = act.date
                  ? new Date(act.date).toLocaleDateString('en-GB', { month: 'long' })
                  : act.month || 'Upcoming';

                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setSelectedActivity(act)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      minHeight: '64px',
                      padding: '10px 14px',
                      border: 'none',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#E4E9F4' : 'transparent',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: 'var(--navy)',
                      cursor: 'pointer',
                      transition: 'background-color 150ms'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {monthName} • {act.goingCount || 0} going • {act.notGoingCount || 0} can't make it
                      </span>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          lineHeight: '20px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {act.title}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '26px',
                        padding: '0 10px',
                        borderRadius: '999px',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {badgeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No activities found. Click "New activity" to create one.
            </div>
          )}
        </section>

        {/* Right Section: Selected Activity Detail */}
        {selectedActivity ? (
          <section
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '28px',
                  padding: '0 12px',
                  borderRadius: '999px',
                  backgroundColor: selectedActivity.status === 'published' ? '#E8F5EE' : '#FDF3D3',
                  color: selectedActivity.status === 'published' ? '#17633D' : '#5C4A00',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: selectedActivity.status === 'published' ? 'var(--forest)' : '#5C4A00'
                  }}
                />
                {selectedActivity.status === 'published' ? 'Live on website' : 'Draft / Planning'}
              </span>

              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '28px', lineHeight: '34px' }}>
                {selectedActivity.title}
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '15px', color: 'var(--navy)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--text-muted)" />
                  {selectedActivity.dateToConfirm
                    ? 'Date to be confirmed'
                    : selectedActivity.date
                    ? new Date(selectedActivity.date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })
                    : 'Date TBA'}
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--text-muted)" />
                  {selectedActivity.startTime
                    ? `${selectedActivity.startTime} ${selectedActivity.endTime ? `to ${selectedActivity.endTime}` : ''}`
                    : 'Time TBA'}
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="var(--text-muted)" />
                  {selectedActivity.venue || '[Venue]'}
                </span>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Going</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '32px', lineHeight: 1, color: 'var(--navy)' }}>
                  {selectedActivity.goingCount || 0}
                </span>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Can't make it</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '32px', lineHeight: 1, color: 'var(--navy)' }}>
                  {selectedActivity.notGoingCount || 0}
                </span>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Itinerary steps</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '32px', lineHeight: 1, color: 'var(--navy)' }}>
                  {selectedActivity.itinerary?.length || 0}
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link
                to={`/staff/activities/${selectedActivity.id}/edit`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '44px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--navy)',
                  backgroundColor: 'var(--white)',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none'
                }}
              >
                <Edit2 size={16} />
                Edit activity
              </Link>

              {selectedActivity.status === 'published' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleHide(selectedActivity.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '44px',
                    padding: '0 18px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--white)',
                    color: 'var(--brand-red)',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  <EyeOff size={16} />
                  Hide from website
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePublish(selectedActivity.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '44px',
                    padding: '0 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--forest)',
                    color: 'var(--white)',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={16} />
                  Publish now
                </button>
              )}
            </div>

            {/* Programme Itinerary */}
            {selectedActivity.itinerary?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Programme</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {selectedActivity.itinerary.map((step, idx) => (
                    <div
                      key={step._id || idx}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--navy)',
                            color: 'var(--white)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--brand-red)' }}>{step.time}</span>
                      </div>
                      <span style={{ fontWeight: 600 }}>{step.title || step.what}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Who's Going RSVP List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Who's going</h3>
                <button
                  type="button"
                  onClick={() => handleExportRsvps(selectedActivity.id, selectedActivity.title)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--white)',
                    color: 'var(--navy)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  Export list
                </button>
              </div>

              {selectedActivity.responses?.length > 0 ? (
                <>
                  <div className="desktop-only" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Name</th>
                          <th style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Country</th>
                          <th style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Faculty</th>
                          <th style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Answer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedActivity.responses.map((resp, idx) => {
                          const isGoing = resp.answer === 'going';
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--paper)' }}>
                              <td style={{ padding: '10px', fontWeight: 700 }}>{resp.fullName}</td>
                              <td style={{ padding: '10px' }}>{resp.countryName || resp.countryCode}</td>
                              <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{resp.faculty || '—'}</td>
                              <td style={{ padding: '10px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    height: '24px',
                                    padding: '0 10px',
                                    borderRadius: '999px',
                                    backgroundColor: isGoing ? '#E8F5EE' : '#FBEAE8',
                                    color: isGoing ? '#17633D' : '#8F1B12',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                >
                                  {isGoing ? 'Going' : "Can't make it"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile RSVP Cards */}
                  <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedActivity.responses.map((resp, idx) => {
                      const isGoing = resp.answer === 'going';
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--paper)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>
                              {resp.fullName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {resp.countryName || resp.countryCode} {resp.faculty ? `• ${resp.faculty}` : ''}
                            </div>
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: '24px',
                              padding: '0 10px',
                              borderRadius: '999px',
                              backgroundColor: isGoing ? '#E8F5EE' : '#FBEAE8',
                              color: isGoing ? '#17633D' : '#8F1B12',
                              fontSize: '12px',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {isGoing ? 'Going' : "Can't make it"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No student RSVPs yet for this activity.
                </div>
              )}
            </div>
          </section>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select an activity from the timeline to see details.
          </div>
        )}
      </div>

      <style>{`
        .staff-activities-grid {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .staff-activities-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
