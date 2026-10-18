import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  MessageSquare,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { broadcastMapUpdate } from '../../lib/mapSync.js';
import { useActivitySync } from '../../lib/activitySync.js';
import { semesterOf } from '../../../../shared/semesters.js';

export function StaffDashboardPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [approvalTab, setApprovalTab] = useState('pending'); // 'pending' | 'recent'

  const currentSemester = semesterOf(new Date());

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.get('/staff/overview');
      setData(res);
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load dashboard data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useActivitySync({
    onUpdate: (update) => {
      if (update?.activityId) {
        setData((prev) => {
          if (!prev || !prev.nextEvent) return prev;
          if (prev.nextEvent.id === update.activityId) {
            return {
              ...prev,
              nextEvent: {
                ...prev.nextEvent,
                goingCount: update.goingCount !== undefined ? update.goingCount : prev.nextEvent.goingCount,
                notGoingCount: update.notGoingCount !== undefined ? update.notGoingCount : prev.nextEvent.notGoingCount
              }
            };
          }
          return prev;
        });
      }
    },
    onFallbackRefresh: () => {
      fetchData(true);
    }
  });

  const handleApprove = async (id, name) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: 'approving' }));
      await api.post(`/staff/approvals/${id}/approve`);
      broadcastMapUpdate({ studentId: id, action: 'approved' });
      showToast({
        message: `Approved ${name}. Approval email queued.`,
        type: 'success',
        duration: 10000,
        action: {
          label: 'Undo (10s)',
          onClick: async () => {
            try {
              await api.post(`/staff/approvals/${id}/undo`);
              broadcastMapUpdate({ studentId: id, action: 'undone' });
              showToast({ message: `Moved ${name} back to pending.`, type: 'info' });
              fetchData();
            } catch (err) {
              showToast({ message: err.message || 'Undo failed.', type: 'error' });
            }
          }
        }
      });
      fetchData();
    } catch (err) {
      showToast({ message: err.message || 'Approval failed.', type: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id, name) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: 'rejecting' }));
      await api.post(`/staff/approvals/${id}/reject`, { reason: 'Eligibility criteria not met' });
      broadcastMapUpdate({ studentId: id, action: 'rejected' });
      showToast({
        message: `Rejected ${name}.`,
        type: 'info',
        duration: 10000,
        action: {
          label: 'Undo (10s)',
          onClick: async () => {
            try {
              await api.post(`/staff/approvals/${id}/undo`);
              broadcastMapUpdate({ studentId: id, action: 'undone' });
              showToast({ message: `Reverted ${name} back to pending.`, type: 'info' });
              fetchData();
            } catch (err) {
              showToast({ message: err.message || 'Undo failed.', type: 'error' });
            }
          }
        }
      });
      fetchData();
    } catch (err) {
      showToast({ message: err.message || 'Rejection failed.', type: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleUndo = async (id, name) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: 'undoing' }));
      await api.post(`/staff/approvals/${id}/undo`);
      broadcastMapUpdate({ studentId: id, action: 'undone' });
      showToast({ message: `Moved ${name} back to pending.`, type: 'info' });
      fetchData();
    } catch (err) {
      showToast({ message: err.message || 'Undo failed.', type: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleRemoveModeration = async (type, id) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await api.post(`/staff/moderation/${type}/${id}/remove`);
      showToast({
        message: 'Content removed from public view.',
        type: 'info',
        action: {
          label: 'Undo',
          onClick: async () => {
            await api.post(`/staff/moderation/${type}/${id}/restore`);
            showToast({ message: 'Content restored.', type: 'success' });
            fetchData();
          }
        }
      });
      fetchData();
    } catch (err) {
      showToast({ message: err.message || 'Failed to remove content.', type: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Skeleton height="40px" width="300px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <Skeleton height="110px" />
          <Skeleton height="110px" />
          <Skeleton height="110px" />
          <Skeleton height="110px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <Skeleton height="320px" />
          <Skeleton height="320px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px 40px' }}>
        <ErrorAlert message={error} onRetry={fetchData} />
      </div>
    );
  }

  const {
    totalStudents = 0,
    pendingApprovalsCount = 0,
    approvedStudentsCount = 0,
    rejectedStudentsCount = 0,
    unansweredQuestionsCount = 0,
    nextEvent = null,
    pendingApprovals = [],
    recentDecisions = [],
    unansweredQuestions = [],
    latestModeration = [],
    topClubAreas = [],
    newProposalsCount = 0
  } = data || {};

  return (
    <div className="staff-page-container">
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800 }}>
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
            {currentSemester}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/staff/live-map"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '44px',
              padding: '0 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              border: '1.5px solid var(--navy)',
              backgroundColor: 'var(--white)',
              color: 'var(--navy)'
            }}
          >
            <MapPin size={18} />
            Live map screen
          </Link>

          <Link
            to="/staff/activities/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '44px',
              padding: '0 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              border: 'none',
              backgroundColor: 'var(--brand-red)',
              color: 'var(--white)'
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Plan an activity
          </Link>
        </div>
      </header>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Approved students</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '38px', lineHeight: '44px', color: 'var(--navy)' }}>
            {totalStudents}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>on the map and in the portal</span>
        </div>

        <div
          style={{
            backgroundColor: pendingApprovalsCount > 0 ? '#FDF3D3' : 'var(--white)',
            border: pendingApprovalsCount > 0 ? '1px solid #F2B705' : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '14px', color: pendingApprovalsCount > 0 ? '#5C4A00' : 'var(--text-muted)' }}>
            Approval requests
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '38px',
              lineHeight: '44px',
              color: pendingApprovalsCount > 0 ? '#5C4A00' : 'var(--navy)'
            }}
          >
            {pendingApprovalsCount}
          </span>
          <span style={{ fontSize: '14px', color: pendingApprovalsCount > 0 ? '#5C4A00' : 'var(--text-muted)' }}>
            waiting for a decision
          </span>
        </div>

        <div
          style={{
            backgroundColor: unansweredQuestionsCount > 0 ? '#FDF3D3' : 'var(--white)',
            border: unansweredQuestionsCount > 0 ? '1px solid #F2B705' : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '14px', color: unansweredQuestionsCount > 0 ? '#5C4A00' : 'var(--text-muted)' }}>
            Open questions
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '38px',
              lineHeight: '44px',
              color: unansweredQuestionsCount > 0 ? '#5C4A00' : 'var(--navy)'
            }}
          >
            {unansweredQuestionsCount}
          </span>
          <span style={{ fontSize: '14px', color: unansweredQuestionsCount > 0 ? '#5C4A00' : 'var(--text-muted)' }}>
            from Ask the coordinator
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {nextEvent?.date
              ? `Going on ${new Date(nextEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
              : 'Going to next activity'}
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '38px', lineHeight: '44px', color: 'var(--navy)' }}>
            {nextEvent?.goingCount || 0}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nextEvent ? `to ${nextEvent.title} • ${nextEvent.notGoingCount || 0} can't make it` : 'No upcoming activity scheduled'}
          </span>
        </div>
      </div>

      {/* Main Grid: Left & Right Columns */}
      <div className="staff-dashboard-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section: Student approval requests */}
          <section
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                  Student approval requests
                </h2>
                <div style={{ display: 'inline-flex', padding: '3px', borderRadius: '10px', backgroundColor: 'var(--paper)', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setApprovalTab('pending')}
                    style={{
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: approvalTab === 'pending' ? 'var(--navy)' : 'transparent',
                      color: approvalTab === 'pending' ? 'var(--white)' : 'var(--text-muted)'
                    }}
                  >
                    Pending ({pendingApprovals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalTab('recent')}
                    style={{
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: approvalTab === 'recent' ? 'var(--navy)' : 'transparent',
                      color: approvalTab === 'recent' ? 'var(--white)' : 'var(--text-muted)'
                    }}
                  >
                    Recent decisions ({recentDecisions.length})
                  </button>
                </div>
              </div>
              <Link to="/staff/approvals" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-red)' }}>
                See all requests →
              </Link>
            </div>

            {approvalTab === 'pending' ? (
              pendingApprovals.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No pending requests. All signed-up students are reviewed!
                  {recentDecisions.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setApprovalTab('recent')}
                        style={{ border: 'none', background: 'none', color: 'var(--brand-red)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        View {recentDecisions.length} recent decisions
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="desktop-only" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Name</th>
                          <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Email</th>
                          <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Country</th>
                          <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Registered</th>
                          <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApprovals.map((p) => {
                          const studentId = p.id || p._id;
                          const sName = p.fullName || p.name;
                          const loadingAction = actionLoading[studentId];

                          return (
                            <tr key={studentId} style={{ borderBottom: '1px solid var(--paper)' }}>
                              <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 700 }}>{sName}</td>
                              <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-muted)' }}>{p.email}</td>
                              <td style={{ padding: '10px 12px', fontSize: '14px' }}>{p.countryName || p.countryCode}</td>
                              <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—'}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    disabled={Boolean(loadingAction)}
                                    onClick={() => handleApprove(studentId, sName)}
                                    style={{
                                      height: '32px',
                                      padding: '0 12px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      backgroundColor: '#1E7B4C',
                                      color: '#FFFFFF',
                                      fontWeight: 700,
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      opacity: loadingAction ? 0.7 : 1,
                                      display: 'inline-flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {loadingAction === 'approving' ? 'Approving...' : 'Approve'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={Boolean(loadingAction)}
                                    onClick={() => handleReject(studentId, sName)}
                                    style={{
                                      height: '32px',
                                      padding: '0 12px',
                                      borderRadius: '8px',
                                      border: '1.5px solid #D9DDE6',
                                      backgroundColor: '#FFFFFF',
                                      color: '#B42318',
                                      fontWeight: 700,
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      opacity: loadingAction ? 0.7 : 1,
                                      display: 'inline-flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {loadingAction === 'rejecting' ? 'Rejecting...' : 'Reject'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Pending Approvals Cards */}
                  <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingApprovals.map((p) => {
                      const studentId = p.id || p._id;
                      const sName = p.fullName || p.name;
                      const loadingAction = actionLoading[studentId];

                      return (
                        <div
                          key={studentId}
                          style={{
                            padding: '14px',
                            borderRadius: '14px',
                            border: '1.5px solid var(--border)',
                            backgroundColor: 'var(--white)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '15px', color: 'var(--navy)', display: 'block' }}>{sName}</strong>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.email}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>{p.countryName || p.countryCode}</span>
                            <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F2F5', paddingTop: '10px' }}>
                            <button
                              type="button"
                              disabled={Boolean(loadingAction)}
                              onClick={() => handleApprove(studentId, sName)}
                              style={{
                                flex: 1,
                                minHeight: '44px',
                                padding: '0 12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#1E7B4C',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loadingAction ? 0.7 : 1
                              }}
                            >
                              {loadingAction === 'approving' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(loadingAction)}
                              onClick={() => handleReject(studentId, sName)}
                              style={{
                                flex: 1,
                                minHeight: '44px',
                                padding: '0 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #D9DDE6',
                                backgroundColor: '#FFFFFF',
                                color: '#B42318',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loadingAction ? 0.7 : 1
                              }}
                            >
                              {loadingAction === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )
            ) : (
              recentDecisions.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No recent decisions yet.
                </div>
              ) : (
                <>
                  <div className="desktop-only" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Name</th>
                        <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Email</th>
                        <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Country</th>
                        <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                        <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDecisions.map((p) => {
                        const studentId = p.id || p._id;
                        const sName = p.fullName || p.name;
                        const isApproved = p.status === 'approved';
                        const isRejected = p.status === 'rejected';
                        const loadingAction = actionLoading[studentId];

                        const badgeBg = isApproved ? '#E8F5EE' : '#FBEAE8';
                        const badgeColor = isApproved ? '#17633D' : '#8F1B12';
                        const badgeLabel = isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending';

                        return (
                          <tr key={studentId} style={{ borderBottom: '1px solid var(--paper)' }}>
                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 700 }}>{sName}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--text-muted)' }}>{p.email}</td>
                            <td style={{ padding: '10px 12px', fontSize: '14px' }}>{p.countryName || p.countryCode}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  height: '24px',
                                  padding: '0 8px',
                                  borderRadius: '999px',
                                  backgroundColor: badgeBg,
                                  color: badgeColor,
                                  fontSize: '12px',
                                  fontWeight: 700
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badgeColor }} />
                                {badgeLabel}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {isRejected ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={Boolean(loadingAction)}
                                      onClick={() => handleApprove(studentId, sName)}
                                      style={{
                                        height: '32px',
                                        padding: '0 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#1E7B4C',
                                        color: '#FFFFFF',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        opacity: loadingAction ? 0.7 : 1
                                      }}
                                    >
                                      {loadingAction === 'approving' ? 'Approving...' : 'Approve'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={Boolean(loadingAction)}
                                      onClick={() => handleUndo(studentId, sName)}
                                      style={{
                                        height: '32px',
                                        padding: '0 10px',
                                        borderRadius: '8px',
                                        border: '1.5px solid #D9DDE6',
                                        backgroundColor: '#FFFFFF',
                                        color: 'var(--navy)',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {loadingAction === 'undoing' ? 'Resetting...' : 'Revert to Pending'}
                                    </button>
                                  </>
                                ) : isApproved ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={Boolean(loadingAction)}
                                      onClick={() => handleReject(studentId, sName)}
                                      style={{
                                        height: '32px',
                                        padding: '0 10px',
                                        borderRadius: '8px',
                                        border: '1.5px solid #D9DDE6',
                                        backgroundColor: '#FFFFFF',
                                        color: '#B42318',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {loadingAction === 'rejecting' ? 'Rejecting...' : 'Reject'}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={Boolean(loadingAction)}
                                      onClick={() => handleUndo(studentId, sName)}
                                      style={{
                                        height: '32px',
                                        padding: '0 10px',
                                        borderRadius: '8px',
                                        border: '1.5px solid #D9DDE6',
                                        backgroundColor: '#FFFFFF',
                                        color: 'var(--navy)',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {loadingAction === 'undoing' ? 'Resetting...' : 'Revert to Pending'}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={Boolean(loadingAction)}
                                    onClick={() => handleUndo(studentId, sName)}
                                    style={{
                                      height: '32px',
                                      padding: '0 10px',
                                      borderRadius: '8px',
                                      border: '1.5px solid #D9DDE6',
                                      backgroundColor: '#FFFFFF',
                                      color: 'var(--navy)',
                                      fontWeight: 700,
                                      fontSize: '13px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Revert to Pending
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Recent Decisions Cards */}
                <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentDecisions.map((p) => {
                    const studentId = p.id || p._id;
                    const sName = p.fullName || p.name;
                    const isApproved = p.status === 'approved';
                    const isRejected = p.status === 'rejected';
                    const loadingAction = actionLoading[studentId];

                    const badgeBg = isApproved ? '#E8F5EE' : '#FBEAE8';
                    const badgeColor = isApproved ? '#17633D' : '#8F1B12';
                    const badgeLabel = isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending';

                    return (
                      <div
                        key={studentId}
                        style={{
                          padding: '14px',
                          borderRadius: '14px',
                          border: '1.5px solid var(--border)',
                          backgroundColor: 'var(--white)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '15px', color: 'var(--navy)', display: 'block' }}>{sName}</strong>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.email} • {p.countryName || p.countryCode}</span>
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              height: '24px',
                              padding: '0 8px',
                              borderRadius: '999px',
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: badgeColor }} />
                            {badgeLabel}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F2F5', paddingTop: '10px' }}>
                          {isRejected ? (
                            <>
                              <button
                                type="button"
                                disabled={Boolean(loadingAction)}
                                onClick={() => handleApprove(studentId, sName)}
                                style={{
                                  flex: 1,
                                  minHeight: '44px',
                                  padding: '0 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  backgroundColor: '#1E7B4C',
                                  color: '#FFFFFF',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  opacity: loadingAction ? 0.7 : 1
                                }}
                              >
                                {loadingAction === 'approving' ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(loadingAction)}
                                onClick={() => handleUndo(studentId, sName)}
                                style={{
                                  flex: 1,
                                  minHeight: '44px',
                                  padding: '0 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #D9DDE6',
                                  backgroundColor: '#FFFFFF',
                                  color: 'var(--navy)',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                Reset
                              </button>
                            </>
                          ) : isApproved ? (
                            <>
                              <button
                                type="button"
                                disabled={Boolean(loadingAction)}
                                onClick={() => handleReject(studentId, sName)}
                                style={{
                                  flex: 1,
                                  minHeight: '44px',
                                  padding: '0 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #D9DDE6',
                                  backgroundColor: '#FFFFFF',
                                  color: '#B42318',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(loadingAction)}
                                onClick={() => handleUndo(studentId, sName)}
                                style={{
                                  flex: 1,
                                  minHeight: '44px',
                                  padding: '0 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #D9DDE6',
                                  backgroundColor: '#FFFFFF',
                                  color: 'var(--navy)',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                Reset
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={Boolean(loadingAction)}
                              onClick={() => handleUndo(studentId, sName)}
                              style={{
                                flex: 1,
                                minHeight: '44px',
                                padding: '0 10px',
                                borderRadius: '8px',
                                border: '1.5px solid #D9DDE6',
                                backgroundColor: '#FFFFFF',
                                color: 'var(--navy)',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer'
                              }}
                            >
                              Revert to Pending
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          )}
          </section>

          {/* Section: Questions from students */}
          <section
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                  Questions from students
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  From Ask the coordinator
                </span>
              </div>
              <Link to="/staff/questions" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-red)' }}>
                Open the inbox
              </Link>
            </div>

            {unansweredQuestions.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                All student questions have been answered.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {unansweredQuestions.slice(0, 3).map((q) => (
                  <div
                    key={q.id || q._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--paper)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#E4E9F4',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--navy)'
                          }}
                        >
                          {q.category === 'activities' || q.topic === 'activities' || q.topic === 'events'
                            ? 'Events'
                            : q.category === 'life' || q.topic === 'life' || q.topic === 'life_in_craiova'
                            ? 'Life in Craiova'
                            : q.category === 'profile_change' || q.topic === 'profile_change'
                            ? 'Profile change'
                            : 'General'}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 700 }}>
                          {q.studentName || q.authorName || 'International Student'}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          • {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : ''}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--navy)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {q.text}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/staff/questions?selected=${q.id || q._id}`)}
                      style={{ flexShrink: 0 }}
                    >
                      Reply
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Next Activity Card */}
          <section
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-red)' }}>Next activity</span>

            {nextEvent ? (
              <>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '66px',
                      flexShrink: 0,
                      borderRadius: '12px',
                      backgroundColor: 'var(--brand-red)',
                      color: 'var(--white)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>
                      {nextEvent.date ? new Date(nextEvent.date).toLocaleDateString('en-GB', { month: 'short' }) : 'TBD'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '26px', lineHeight: '28px' }}>
                      {nextEvent.date ? new Date(nextEvent.date).getDate() : '--'}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800 }}>
                      {nextEvent.title}
                    </h3>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {nextEvent.startTime || 'Time TBA'} • {nextEvent.venue || '[Venue]'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--paper)' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Going</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', color: 'var(--navy)' }}>
                      {nextEvent.goingCount || 0}
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--paper)' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Can't make it</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', color: 'var(--navy)' }}>
                      {nextEvent.notGoingCount || 0}
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--paper)' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Itinerary steps</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', color: 'var(--navy)' }}>
                      {nextEvent.itineraryCount || 0}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    to={`/staff/activities/${nextEvent.id}/edit`}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '40px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '14px',
                      textDecoration: 'none',
                      border: '1.5px solid var(--navy)',
                      backgroundColor: 'var(--white)',
                      color: 'var(--navy)'
                    }}
                  >
                    Edit activity
                  </Link>
                  <Link
                    to="/staff/activities"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '40px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '14px',
                      textDecoration: 'none',
                      border: 'none',
                      backgroundColor: 'var(--brand-red)',
                      color: 'var(--white)'
                    }}
                  >
                    See who's going
                  </Link>
                </div>
              </>
            ) : (
              <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                No published upcoming events.
              </div>
            )}
          </section>

          {/* Latest from students */}
          <section
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Latest from students
              </h2>
              <Link to="/staff/moderation" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-red)' }}>
                See all
              </Link>
            </div>

            {latestModeration.length === 0 ? (
              <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                No recent wall posts or words.
              </div>
            ) : (
              latestModeration.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--paper)'
                  }}
                >
                  <MessageSquare size={16} color="var(--navy)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <strong>{item.authorName}</strong> {item.type === 'wall' ? 'on the wall' : 'shared a word'}: "{item.snippet}"
                  </span>
                  <button
                    type="button"
                    disabled={actionLoading[item.id]}
                    onClick={() => handleRemoveModeration(item.type, item.id)}
                    style={{
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--white)',
                      color: 'var(--brand-red)',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </section>

          {/* Club Ideas */}
          <section
            style={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Club ideas
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Not public yet</span>
            </div>

            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Most upvoted</span>

            {topClubAreas.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No interest areas created yet.</div>
            ) : (
              topClubAreas.slice(0, 5).map((area) => {
                const maxVotes = Math.max(...topClubAreas.map((a) => a.upvoteCount || 0), 1);
                const percent = Math.min(100, Math.round(((area.upvoteCount || 0) / maxVotes) * 100));

                return (
                  <div
                    key={area.id || area._id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '130px minmax(0, 1fr) 26px',
                      gap: '10px',
                      alignItems: 'center',
                      fontSize: '13px'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={area.name || area.title}>
                      {area.name || area.title}
                    </span>
                    <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#E8F5EE' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--forest)'
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 700, textAlign: 'right' }}>{area.upvoteCount || 0}</span>
                  </div>
                );
              })
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: '#FDF3D3'
              }}
            >
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#5C4A00' }}>
                {newProposalsCount} new club proposals
              </span>
              <Link
                to="/staff/clubs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--navy)',
                  backgroundColor: 'var(--white)',
                  color: 'var(--navy)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Review
              </Link>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .staff-dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .staff-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
