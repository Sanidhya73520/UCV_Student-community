import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, XCircle, Search, RotateCcw, Info } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { broadcastMapUpdate } from '../../lib/mapSync.js';

export function StaffApprovalsPage() {
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/staff/approvals?status=${tab}&q=${encodeURIComponent(search)}`);
      setStudents(res.students || []);
      setCounts({
        pending: res.pendingCount ?? 0,
        approved: res.approvedCount ?? 0,
        rejected: res.rejectedCount ?? 0,
        all: res.allCount ?? (res.students?.length || 0)
      });
    } catch (err) {
      setError(err.message || 'Failed to load approval requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchApprovals();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [tab, search]);

  const handleApprove = async (student) => {
    const studentId = student.id || student._id;
    try {
      setActionLoading((prev) => ({ ...prev, [studentId]: 'approving' }));
      await api.post(`/staff/approvals/${studentId}/approve`);
      broadcastMapUpdate({ studentId, countryCode: student.countryCode, action: 'approved' });

      showToast({
        message: `${student.fullName} approved. Approval email queued.`,
        type: 'success',
        duration: 10000,
        action: {
          label: 'Undo (10s)',
          onClick: async () => {
            try {
              await api.post(`/staff/approvals/${studentId}/undo`);
              broadcastMapUpdate({ studentId, countryCode: student.countryCode, action: 'undone' });
              showToast({ message: `Moved ${student.fullName} back to pending.`, type: 'info' });
              fetchApprovals();
            } catch (err) {
              showToast({ message: err.message || 'Failed to undo.', type: 'error' });
            }
          }
        }
      });

      fetchApprovals();
    } catch (err) {
      showToast({ message: err.message || 'Approval failed.', type: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [studentId]: null }));
    }
  };

  const handleReject = async (student) => {
    const studentId = student.id || student._id;
    try {
      setActionLoading((prev) => ({ ...prev, [studentId]: 'rejecting' }));
      await api.post(`/staff/approvals/${studentId}/reject`, { reason: 'Eligibility criteria not met' });
      broadcastMapUpdate({ studentId, countryCode: student.countryCode, action: 'rejected' });

      showToast({
        message: `${student.fullName} rejected.`,
        type: 'info',
        duration: 10000,
        action: {
          label: 'Undo (10s)',
          onClick: async () => {
            try {
              await api.post(`/staff/approvals/${studentId}/undo`);
              broadcastMapUpdate({ studentId, countryCode: student.countryCode, action: 'undone' });
              showToast({ message: `Reverted ${student.fullName} back to pending.`, type: 'info' });
              fetchApprovals();
            } catch (err) {
              showToast({ message: err.message || 'Failed to undo.', type: 'error' });
            }
          }
        }
      });

      fetchApprovals();
    } catch (err) {
      showToast({ message: err.message || 'Rejection failed.', type: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [studentId]: null }));
    }
  };

  const handleUndo = async (student) => {
    const studentId = student.id || student._id;
    try {
      setActionLoading((prev) => ({ ...prev, [studentId]: 'undoing' }));
      await api.post(`/staff/approvals/${studentId}/undo`);
      broadcastMapUpdate({ studentId, countryCode: student.countryCode, action: 'undone' });
      showToast({ message: `Moved ${student.fullName} back to pending.`, type: 'info' });
      fetchApprovals();
    } catch (err) {
      showToast({ message: err.message || 'Failed to undo.', type: 'error' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [studentId]: null }));
    }
  };

  const tabs = [
    { id: 'pending', label: `Pending (${counts.pending})` },
    { id: 'approved', label: `Approved (${counts.approved})` },
    { id: 'rejected', label: `Rejected (${counts.rejected})` },
    { id: 'all', label: `All (${counts.all})` }
  ];

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800 }}>
          Student approval requests
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
          Students who signed up and are waiting for access.
        </p>
      </header>

      {/* Main Table Card */}
      <section className="staff-section-card">
        {/* Controls: Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div role="tablist" aria-label="Filter requests" className="horizontal-scroll-row" style={{ display: 'flex', gap: '6px' }}>
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '999px',
                    border: active ? '1.5px solid var(--navy)' : '1.5px solid var(--border)',
                    backgroundColor: active ? 'var(--navy)' : 'var(--white)',
                    color: active ? 'var(--white)' : 'var(--navy)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="staff-search-box">
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="search"
              aria-label="Search requests"
              placeholder="Search name, email or country"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px 0 38px',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                backgroundColor: 'var(--white)',
                fontFamily: 'inherit',
                fontSize: '14px',
                color: 'var(--navy)'
              }}
            />
          </div>
        </div>

        {error && <ErrorAlert message={error} onRetry={fetchApprovals} />}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </div>
        ) : students.length > 0 ? (
          <>
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Country</th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Faculty / Programme</th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Registered</th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((r) => {
                  const isPending = r.status === 'waiting' || r.status === 'pending';
                  const isApproved = r.status === 'approved';
                  const isRejected = r.status === 'rejected';

                  const badgeBg = isPending ? '#FDF3D3' : isApproved ? '#E8F5EE' : '#FBEAE8';
                  const badgeColor = isPending ? '#5C4A00' : isApproved ? '#17633D' : '#8F1B12';
                  const badgeLabel = isPending ? 'Pending' : isApproved ? 'Approved' : 'Rejected';

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--paper)' }}>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: 700 }}>{r.fullName}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>{r.email}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>{r.mobile || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{r.countryName || r.countryCode}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--navy)' }}>
                        <div style={{ fontWeight: 600 }}>{r.faculty || 'Not set'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.programme || 'Erasmus+'}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            height: '26px',
                            padding: '0 10px',
                            borderRadius: '999px',
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: badgeColor
                            }}
                          />
                          {badgeLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isPending && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              disabled={Boolean(actionLoading[r.id || r._id])}
                              onClick={() => handleApprove(r)}
                              style={{
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#1E7B4C',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: actionLoading[r.id || r._id] ? 0.7 : 1,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                            >
                              {actionLoading[r.id || r._id] === 'approving' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(actionLoading[r.id || r._id])}
                              onClick={() => handleReject(r)}
                              style={{
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1.5px solid #D9DDE6',
                                backgroundColor: '#FFFFFF',
                                color: '#B42318',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                              }}
                            >
                              {actionLoading[r.id || r._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        )}

                        {isRejected && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              disabled={Boolean(actionLoading[r.id || r._id])}
                              onClick={() => handleApprove(r)}
                              style={{
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#1E7B4C',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: actionLoading[r.id || r._id] ? 0.7 : 1,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                            >
                              {actionLoading[r.id || r._id] === 'approving' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(actionLoading[r.id || r._id])}
                              onClick={() => handleUndo(r)}
                              style={{
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1.5px solid #D9DDE6',
                                backgroundColor: '#FFFFFF',
                                color: 'var(--navy)',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                              }}
                            >
                              {actionLoading[r.id || r._id] === 'undoing' ? 'Resetting...' : 'Revert to Pending'}
                            </button>
                          </div>
                        )}

                        {isApproved && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              disabled={Boolean(actionLoading[r.id || r._id])}
                              onClick={() => handleReject(r)}
                              style={{
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1.5px solid #D9DDE6',
                                backgroundColor: '#FFFFFF',
                                color: '#B42318',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                              }}
                            >
                              {actionLoading[r.id || r._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(actionLoading[r.id || r._id])}
                              onClick={() => handleUndo(r)}
                              style={{
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1.5px solid #D9DDE6',
                                backgroundColor: '#FFFFFF',
                                color: 'var(--navy)',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                              }}
                            >
                              {actionLoading[r.id || r._id] === 'undoing' ? 'Resetting...' : 'Revert to Pending'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (M6) */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {students.map((r) => {
              const isPending = r.status === 'waiting' || r.status === 'pending';
              const isApproved = r.status === 'approved';
              const isRejected = r.status === 'rejected';

              const badgeBg = isPending ? '#FDF3D3' : isApproved ? '#E8F5EE' : '#FBEAE8';
              const badgeColor = isPending ? '#5C4A00' : isApproved ? '#17633D' : '#8F1B12';
              const badgeLabel = isPending ? 'Pending' : isApproved ? 'Approved' : 'Rejected';

              return (
                <div
                  key={r.id || r._id}
                  style={{
                    backgroundColor: 'var(--white)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(24, 32, 58, 0.04)'
                  }}
                >
                  {/* Top row: Name & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--navy)', wordBreak: 'break-word' }}>
                        {r.fullName}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                        {r.email}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
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
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: badgeColor
                        }}
                      />
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Metadata fields */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px 12px',
                      padding: '10px 0',
                      borderTop: '1px solid #F0F2F5',
                      borderBottom: '1px solid #F0F2F5',
                      fontSize: '13px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Country</span>
                      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.countryName || r.countryCode}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Registered</span>
                      <span style={{ color: 'var(--navy)' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—'}
                      </span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Faculty / Programme</span>
                      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.faculty || 'Not set'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> • {r.programme || 'Erasmus+'}</span>
                    </div>
                  </div>

                  {/* Action buttons (full width or side-by-side with 44px min-height) */}
                  <div>
                    {isPending && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          disabled={Boolean(actionLoading[r.id || r._id])}
                          onClick={() => handleApprove(r)}
                          style={{
                            flex: 1,
                            minHeight: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#1E7B4C',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: actionLoading[r.id || r._id] ? 0.7 : 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          {actionLoading[r.id || r._id] === 'approving' ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(actionLoading[r.id || r._id])}
                          onClick={() => handleReject(r)}
                          style={{
                            flex: 1,
                            minHeight: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: '1.5px solid #D9DDE6',
                            backgroundColor: '#FFFFFF',
                            color: '#B42318',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                          }}
                        >
                          {actionLoading[r.id || r._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {isRejected && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          disabled={Boolean(actionLoading[r.id || r._id])}
                          onClick={() => handleApprove(r)}
                          style={{
                            flex: 1,
                            minHeight: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: '#1E7B4C',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: actionLoading[r.id || r._id] ? 0.7 : 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          {actionLoading[r.id || r._id] === 'approving' ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(actionLoading[r.id || r._id])}
                          onClick={() => handleUndo(r)}
                          style={{
                            flex: 1,
                            minHeight: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: '1.5px solid #D9DDE6',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--navy)',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                          }}
                        >
                          {actionLoading[r.id || r._id] === 'undoing' ? 'Resetting...' : 'Revert to Pending'}
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          disabled={Boolean(actionLoading[r.id || r._id])}
                          onClick={() => handleReject(r)}
                          style={{
                            flex: 1,
                            minHeight: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: '1.5px solid #D9DDE6',
                            backgroundColor: '#FFFFFF',
                            color: '#B42318',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                          }}
                        >
                          {actionLoading[r.id || r._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(actionLoading[r.id || r._id])}
                          onClick={() => handleUndo(r)}
                          style={{
                            flex: 1,
                            minHeight: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: '1.5px solid #D9DDE6',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--navy)',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: actionLoading[r.id || r._id] ? 0.7 : 1
                          }}
                        >
                          {actionLoading[r.id || r._id] === 'undoing' ? 'Resetting...' : 'Revert to Pending'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
        ) : (
          /* Empty State (Screen 38) */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '56px 20px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#E8F5EE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--forest)'
              }}
            >
              <Check size={40} strokeWidth={2.8} />
            </div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800 }}>
              {tab === 'pending' ? 'No pending requests' : 'Nothing here yet'}
            </h2>
            <p style={{ margin: 0, maxWidth: '420px', fontSize: '15px', color: 'var(--text-muted)', lineHeight: '22px' }}>
              {tab === 'pending'
                ? 'You are all caught up. New sign-ups will appear here for approval.'
                : 'Requests you approve or reject will be listed here.'}
            </p>
          </div>
        )}
      </section>

      {/* Info Tip */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          padding: '14px 18px',
          borderRadius: '12px',
          backgroundColor: '#E4E9F4',
          fontSize: '14px',
          color: 'var(--navy)',
          lineHeight: '21px'
        }}
      >
        <Info size={20} color="var(--navy)" style={{ flexShrink: 0 }} />
        <span>
          Approving sends the approval email and adds the student's country to the map on the website. Pending and rejected requests never appear on the map.
        </span>
      </div>
    </div>
  );
}
