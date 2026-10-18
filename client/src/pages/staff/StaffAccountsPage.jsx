import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';

export function StaffAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  // Invite form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);

  // Deactivate confirm modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, account: null });
  const [actionInProgress, setActionInProgress] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/staff/accounts');
      setAccounts(res?.accounts || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Please provide both name and email.');
      return;
    }

    try {
      setInviting(true);
      await api.post('/staff/accounts/invite', {
        fullName: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole
      });
      showToast(`Invitation sent. They appear in the list as Invited.`);
      setInviteName('');
      setInviteEmail('');
      loadAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to invite staff member.');
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (account) => {
    try {
      setActionInProgress((p) => ({ ...p, [account.id]: 'resending' }));
      await api.post(`/staff/accounts/${account.id}/resend`);
      showToast(`Invitation sent again to ${account.email} with a new temporary password.`);
      loadAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to resend invitation.');
    } finally {
      setActionInProgress((p) => ({ ...p, [account.id]: null }));
    }
  };

  const handleRemoveConfirm = async () => {
    const account = confirmModal.account;
    if (!account) return;

    try {
      setActionInProgress((p) => ({ ...p, [account.id]: 'removing' }));
      await api.post(`/staff/accounts/${account.id}/remove`);
      showToast(`${account.fullName} can no longer sign in.`);
      setConfirmModal({ open: false, account: null });
      loadAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to remove access.');
    } finally {
      setActionInProgress((p) => ({ ...p, [account.id]: null }));
    }
  };

  const handleRestore = async (account) => {
    try {
      setActionInProgress((p) => ({ ...p, [account.id]: 'restoring' }));
      await api.post(`/staff/accounts/${account.id}/restore`);
      showToast(`Access restored for ${account.fullName}.`);
      loadAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to restore access.');
    } finally {
      setActionInProgress((p) => ({ ...p, [account.id]: null }));
    }
  };

  return (
    <div className="staff-page-container">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#18203A',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: 14,
            fontWeight: 700,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(24px, 5vw, 32px)',
              lineHeight: '38px',
              letterSpacing: '-0.5px'
            }}
          >
            Staff accounts
          </h1>
          <span style={{ fontSize: 15, color: '#4A536B' }}>Admins only.</span>
        </div>
      </header>

      {error && (
        <div style={{ background: '#FBEAE8', color: '#8F1B12', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Main Split Layout */}
      <div className="staff-accounts-layout">
        {/* Staff accounts table */}
        <section
          style={{
            flex: '1 1 580px',
            minWidth: 0,
            background: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: 20,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              lineHeight: '26px'
            }}
          >
            Staff accounts
          </h2>

          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Name</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Email</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Role</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Status</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>
                      Loading staff accounts...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>
                      No staff accounts found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((p) => {
                    const isPermanent = Boolean(p.isPermanentAdmin);
                    const isInvited = p.status === 'invited';
                    const isRemoved = p.status === 'removed';
                    const isActive = p.status === 'active' || (!isInvited && !isRemoved);

                    let statusBadge = { text: 'Active', bg: '#E8F5EE', fg: '#17633D' };
                    if (isInvited) {
                      statusBadge = { text: 'Invited', bg: '#FDF3D3', fg: '#5C4A00' };
                    } else if (isRemoved) {
                      statusBadge = { text: 'No access', bg: '#EEF0F4', fg: '#4A536B' };
                    }

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #EEF0F4' }}>
                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                          <strong>{p.fullName}</strong>
                          {isPermanent && (
                            <div style={{ fontSize: 12, color: '#4A536B' }}>Developer / Lead Admin</div>
                          )}
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'middle', color: '#2E3650' }}>
                          {p.email}
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: 26,
                              padding: '0 10px',
                              borderRadius: 999,
                              background: p.role === 'admin' ? '#E4E9F4' : '#EEF0F4',
                              color: p.role === 'admin' ? '#18203A' : '#4A536B',
                              fontSize: 12,
                              fontWeight: 700
                            }}
                          >
                            {p.role === 'admin' ? 'Admin' : 'Staff'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: 26,
                              padding: '0 10px',
                              borderRadius: 999,
                              background: statusBadge.bg,
                              color: statusBadge.fg,
                              fontSize: 12,
                              fontWeight: 700
                            }}
                          >
                            {statusBadge.text}
                          </span>
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                          {isPermanent ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 13,
                                color: '#4A536B',
                                fontWeight: 700
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                              Permanent admin
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                              {isInvited && (
                                <button
                                  type="button"
                                  onClick={() => handleResend(p)}
                                  disabled={actionInProgress[p.id] === 'resending'}
                                  style={{
                                    height: 34,
                                    padding: '0 10px',
                                    borderRadius: 8,
                                    fontFamily: 'inherit',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    border: '1.5px solid #C3C9D6',
                                    background: '#FFFFFF',
                                    color: '#18203A',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {actionInProgress[p.id] === 'resending' ? 'Sending...' : 'Resend invitation'}
                                </button>
                              )}
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmModal({ open: true, account: p })}
                                  style={{
                                    height: 34,
                                    padding: '0 10px',
                                    borderRadius: 8,
                                    fontFamily: 'inherit',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    border: '1.5px solid #C3C9D6',
                                    background: '#FFFFFF',
                                    color: '#8F1B12',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Remove access
                                </button>
                              )}
                              {isRemoved && (
                                <button
                                  type="button"
                                  onClick={() => handleRestore(p)}
                                  disabled={actionInProgress[p.id] === 'restoring'}
                                  style={{
                                    height: 34,
                                    padding: '0 10px',
                                    borderRadius: 8,
                                    fontFamily: 'inherit',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    border: '1.5px solid #C3C9D6',
                                    background: '#FFFFFF',
                                    color: '#18203A',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {actionInProgress[p.id] === 'restoring' ? 'Restoring...' : 'Restore access'}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Accounts Cards List */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>Loading staff accounts...</div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>No staff accounts found.</div>
            ) : (
              accounts.map((p) => {
                const isPermanent = Boolean(p.isPermanentAdmin);
                const isInvited = p.status === 'invited';
                const isRemoved = p.status === 'removed';
                const isActive = p.status === 'active' || (!isInvited && !isRemoved);

                let statusBadge = { text: 'Active', bg: '#E8F5EE', fg: '#17633D' };
                if (isInvited) {
                  statusBadge = { text: 'Invited', bg: '#FDF3D3', fg: '#5C4A00' };
                } else if (isRemoved) {
                  statusBadge = { text: 'No access', bg: '#EEF0F4', fg: '#4A536B' };
                }

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: '1px solid #D9DDE6',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ fontSize: '15px', color: '#18203A', wordBreak: 'break-word' }}>{p.fullName}</strong>
                        {isPermanent && <div style={{ fontSize: 12, color: '#4A536B' }}>Developer / Lead Admin</div>}
                        <div style={{ fontSize: 13, color: '#4A536B', marginTop: 2, wordBreak: 'break-all' }}>{p.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <span style={{ height: 24, padding: '0 8px', borderRadius: 999, background: p.role === 'admin' ? '#E4E9F4' : '#EEF0F4', color: p.role === 'admin' ? '#18203A' : '#4A536B', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                          {p.role === 'admin' ? 'Admin' : 'Staff'}
                        </span>
                        <span style={{ height: 24, padding: '0 8px', borderRadius: 999, background: statusBadge.bg, color: statusBadge.fg, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                          {statusBadge.text}
                        </span>
                      </div>
                    </div>
                    {!isPermanent && (
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #EEF0F4', paddingTop: '10px' }}>
                        {isInvited && (
                          <button type="button" onClick={() => handleResend(p)} disabled={actionInProgress[p.id] === 'resending'} style={{ flex: 1, minHeight: '44px', padding: '0 12px', borderRadius: 8, border: '1.5px solid #C3C9D6', background: '#FFFFFF', fontWeight: 700, fontSize: 13, color: '#18203A', cursor: 'pointer' }}>
                            {actionInProgress[p.id] === 'resending' ? 'Sending...' : 'Resend invite'}
                          </button>
                        )}
                        {isActive && (
                          <button type="button" onClick={() => setConfirmModal({ open: true, account: p })} disabled={actionInProgress[p.id] === 'removing'} style={{ flex: 1, minHeight: '44px', padding: '0 12px', borderRadius: 8, border: '1.5px solid #D9DDE6', background: '#FFFFFF', fontWeight: 700, fontSize: 13, color: '#8F1B12', cursor: 'pointer' }}>
                            Remove access
                          </button>
                        )}
                        {isRemoved && (
                          <button type="button" onClick={() => handleRestore(p)} disabled={actionInProgress[p.id] === 'restoring'} style={{ flex: 1, minHeight: '44px', padding: '0 12px', borderRadius: 8, border: '1.5px solid #C3C9D6', background: '#FFFFFF', fontWeight: 700, fontSize: 13, color: '#18203A', cursor: 'pointer' }}>
                            {actionInProgress[p.id] === 'restoring' ? 'Restoring...' : 'Restore access'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Invite New Staff Section (Screen 49) */}
        <section
          style={{
            width: 400,
            flexShrink: 0,
            background: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: 20,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              lineHeight: '26px'
            }}
          >
            Invite new staff
          </h2>
          <span style={{ fontSize: 14, lineHeight: '21px', color: '#4A536B' }}>
            They get an email with their login link, their email and a temporary password. On first sign-in they set their own password.
          </span>

          <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="sn" style={{ fontSize: 14, fontWeight: 700, color: '#18203A' }}>
                Name
              </label>
              <input
                id="sn"
                type="text"
                placeholder="Full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                style={{
                  height: 44,
                  padding: '0 14px',
                  border: '1.5px solid #C3C9D6',
                  borderRadius: 10,
                  background: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  color: '#18203A'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="se" style={{ fontSize: 14, fontWeight: 700, color: '#18203A' }}>
                Email address
              </label>
              <input
                id="se"
                type="email"
                placeholder="name@ucv.ro"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{
                  height: 44,
                  padding: '0 14px',
                  border: '1.5px solid #C3C9D6',
                  borderRadius: 10,
                  background: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  color: '#18203A'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="role-select" style={{ fontSize: 14, fontWeight: 700, color: '#18203A' }}>
                Role
              </label>
              <select
                id="role-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{
                  height: 44,
                  padding: '0 14px',
                  border: '1.5px solid #C3C9D6',
                  borderRadius: 10,
                  background: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  color: '#18203A'
                }}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 44,
                padding: '0 18px',
                borderRadius: 10,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                background: '#B42318',
                color: '#FFFFFF',
                alignSelf: 'flex-start',
                cursor: inviting ? 'not-allowed' : 'pointer',
                marginTop: 4
              }}
            >
              {inviting ? 'Sending...' : 'Send invitation'}
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 12,
              background: '#F2F3F6',
              fontSize: 13,
              lineHeight: '19px',
              color: '#2E3650',
              marginTop: 6
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span>
              All invited staff get the same staff access. Only admins see Staff accounts and Import students.
            </span>
          </div>
        </section>
      </div>

      {/* Confirmation Modal for Removing Access */}
      {confirmModal.open && confirmModal.account && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24, 32, 58, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 440,
              width: '100%',
              padding: 28,
              boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: '#18203A'
              }}
            >
              Remove staff access?
            </h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: '21px', color: '#4A536B' }}>
              Are you sure you want to deactivate access for <strong>{confirmModal.account.fullName}</strong> ({confirmModal.account.email})? They will no longer be able to log in to the staff portal.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, account: null })}
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 10,
                  border: '1.5px solid #C3C9D6',
                  background: '#FFFFFF',
                  color: '#18203A',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#B42318',
                  color: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout styles */}
      <style>{`
        .staff-accounts-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .staff-accounts-layout {
            flex-direction: column !important;
          }
          .staff-accounts-layout > section {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
