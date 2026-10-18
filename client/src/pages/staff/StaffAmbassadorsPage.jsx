import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';

export function StaffAmbassadorsPage() {
  const [data, setData] = useState({ pendingApplications: [], ambassadors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificateHours, setCertificateHours] = useState(10);
  const [toast, setToast] = useState('');

  // Log Hours modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logStudentId, setLogStudentId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logHours, setLogHours] = useState('2');
  const [logWhat, setLogWhat] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  // Active action states
  const [actionInProgress, setActionInProgress] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, settingsRes] = await Promise.all([
        api.get('/staff/ambassadors'),
        api.get('/public/settings').catch(() => null)
      ]);
      setData(res || { pendingApplications: [], ambassadors: [] });
      if (settingsRes?.settings?.certificateHours) {
        setCertificateHours(settingsRes.settings.certificateHours);
      }
    } catch (err) {
      setError(err.message || 'Failed to load ambassadors data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (appId, studentName) => {
    try {
      setActionInProgress((p) => ({ ...p, [appId]: 'approving' }));
      await api.post(`/api/staff/ambassadors/${appId}/approve`);
      showToast(`${studentName} is now an International Student Ambassador.`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to approve application.');
    } finally {
      setActionInProgress((p) => ({ ...p, [appId]: null }));
    }
  };

  const handleNotNow = async (appId, studentName) => {
    try {
      setActionInProgress((p) => ({ ...p, [appId]: 'declining' }));
      await api.post(`/api/staff/ambassadors/${appId}/not-now`);
      showToast(`Application marked as Not now.`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update application.');
    } finally {
      setActionInProgress((p) => ({ ...p, [appId]: null }));
    }
  };

  const handleLogHoursSubmit = async (e) => {
    e.preventDefault();
    if (!logStudentId) {
      showToast('Please select an ambassador.');
      return;
    }
    const hrs = parseFloat(logHours);
    if (!hrs || hrs <= 0) {
      showToast('Please enter a valid number of hours.');
      return;
    }

    try {
      setSubmittingLog(true);
      await api.post('/staff/ambassadors/hours', {
        studentId: logStudentId,
        date: logDate,
        hours: hrs,
        whatDidTheyDo: logWhat.trim()
      });
      showToast('Hours logged successfully.');
      setLogModalOpen(false);
      setLogWhat('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to log hours.');
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleDownloadBulkCertificates = () => {
    window.location.href = '/api/staff/ambassadors/certificates';
  };

  const handleDownloadSingleCert = (id) => {
    window.location.href = `/api/staff/ambassadors/${id}/certificate`;
  };

  // Sample or active club leads breakdown based on ambassadors
  const clubLeads = [
    { name: 'International Café', count: 2, alert: false },
    { name: 'Language Exchange', count: 2, alert: false },
    { name: 'Discover Craiova', count: 2, alert: false },
    { name: 'Ideas Club', count: 1, alert: false },
    { name: 'Movie Club', count: 1, alert: true, note: 'Needs a second host' }
  ];

  const ambassadorsList = data.ambassadors || [];
  const applicationsList = data.pendingApplications || [];
  const readyCount = ambassadorsList.filter((a) => (a.loggedHours || 0) >= certificateHours).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
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
              fontSize: 32,
              lineHeight: '38px',
              letterSpacing: '-0.5px'
            }}
          >
            Ambassadors
          </h1>
          <span style={{ fontSize: 15, color: '#4A536B' }}>
            {ambassadorsList.length} ambassadors. The plan asks for 10 to 15.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            id="log-hours-button"
            onClick={() => {
              if (ambassadorsList.length > 0) {
                setLogStudentId(ambassadorsList[0].id);
              }
              setLogModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              border: '1.5px solid #18203A',
              background: '#FFFFFF',
              color: '#18203A',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Log hours
          </button>
          <button
            type="button"
            id="download-certificates-button"
            onClick={handleDownloadBulkCertificates}
            title={readyCount > 0 ? `Download certificates for ${readyCount} ambassadors` : 'Download certificates'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 16px',
              borderRadius: 10,
              border: 'none',
              background: '#B42318',
              color: '#FFFFFF',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="9" r="6" />
              <path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7" />
            </svg>
            Download certificates
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: '#FBEAE8', color: '#8F1B12', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Content Layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Main Ambassadors Table */}
        <section
          style={{
            flex: '1 1 600px',
            minWidth: 0,
            background: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: 16,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F7F8FA' }}>
                  <th scope="col" style={{ textAlign: 'left', padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Name</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>From</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Role</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>In Craiova until</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Hours</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Status</th>
                  <th scope="col" style={{ textAlign: 'center', padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#4A536B' }}>
                      Loading ambassadors...
                    </td>
                  </tr>
                ) : ambassadorsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#4A536B' }}>
                      No accepted ambassadors yet. Review applicants from the right panel.
                    </td>
                  </tr>
                ) : (
                  ambassadorsList.map((a, idx) => {
                    const isReady = (a.loggedHours || 0) >= certificateHours;
                    return (
                      <tr key={a.id || idx} style={{ borderBottom: '1px solid #EEF0F4' }}>
                        <td style={{ padding: '13px 14px', fontWeight: 700 }}>{a.fullName}</td>
                        <td style={{ padding: '13px 14px', color: '#2E3650' }}>{a.countryName}</td>
                        <td style={{ padding: '13px 14px', color: '#4A536B' }}>{a.role || 'Ambassador'}</td>
                        <td style={{ padding: '13px 14px', color: '#4A536B' }}>Jun 2027</td>
                        <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: 700 }}>
                          {a.loggedHours || 0}
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          {isReady ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                height: 26,
                                padding: '0 10px',
                                borderRadius: 999,
                                background: '#FDF3D3',
                                color: '#5C4A00',
                                fontSize: 12,
                                fontWeight: 700
                              }}
                            >
                              Ready
                            </span>
                          ) : (
                            <span style={{ color: '#4A536B', fontSize: 13 }}>In progress</span>
                          )}
                        </td>
                        <td style={{ padding: '13px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleCert(a.id)}
                            title={`Download certificate for ${a.fullName}`}
                            style={{
                              background: 'transparent',
                              border: '1px solid #C3C9D6',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: 12,
                              color: '#18203A',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderTop: '1px solid #D9DDE6',
              fontSize: 14,
              color: '#4A536B'
            }}
          >
            <span>Showing {ambassadorsList.length} ambassadors</span>
            <span>Certificates unlock at [{certificateHours}] hours</span>
          </div>
        </section>

        {/* Right Sidebar Columns */}
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Applications Card (Screen 44) */}
          <section
            id="requests"
            style={{
              background: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: '26px'
                }}
              >
                Want to be ambassadors
              </h2>
              <span style={{ fontSize: 14, color: '#4A536B' }}>
                {applicationsList.length} students applied.
              </span>
            </div>

            {applicationsList.length === 0 ? (
              <div style={{ padding: '16px 12px', background: '#F2F3F6', borderRadius: 12, fontSize: 13, color: '#4A536B', textAlign: 'center' }}>
                No pending ambassador applications at this time.
              </div>
            ) : (
              applicationsList.map((app) => {
                const sName = app.student?.fullName || 'Student';
                const sCountry = app.student?.countryName || '';
                const busy = actionInProgress[app.id];

                return (
                  <div
                    key={app.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      padding: 12,
                      background: '#F2F3F6',
                      borderRadius: 12
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{sName}</span>
                      <span style={{ fontSize: 13, color: '#4A536B' }}>{sCountry}</span>
                      {app.languages && (
                        <span style={{ fontSize: 12, color: '#7E879E', marginTop: 2 }}>
                          Languages: {app.languages}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => handleApprove(app.id, sName)}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          border: 'none',
                          background: '#B42318',
                          color: '#FFFFFF',
                          fontFamily: 'inherit',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy ? 0.7 : 1
                        }}
                      >
                        {busy === 'approving' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => handleNotNow(app.id, sName)}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          border: '1.5px solid #C3C9D6',
                          background: '#FFFFFF',
                          color: '#18203A',
                          fontFamily: 'inherit',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy ? 0.7 : 1
                        }}
                      >
                        {busy === 'declining' ? '...' : 'Not now'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Club Leads (Screen 44 display only) */}
          {/* <section
            style={{
              background: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                lineHeight: '26px'
              }}
            >
              Club leads
            </h2>
            {clubLeads.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 32,
                  fontSize: 15
                }}
              >
                <span>{c.name}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {c.alert && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 24,
                        padding: '0 8px',
                        borderRadius: 999,
                        background: '#FDF3D3',
                        color: '#5C4A00',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      {c.note}
                    </span>
                  )}
                  <span style={{ fontWeight: 700 }}>{c.count}</span>
                </span>
              </div>
            ))}
          </section> */}
        </div>
      </div>

      {/* Log Hours Modal */}
      {logModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-hours-title"
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
              width: '100%',
              maxWidth: 480,
              padding: 28,
              boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}
          >
            <h2
              id="log-hours-title"
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: '#18203A'
              }}
            >
              Log Ambassador Hours
            </h2>

            <form onSubmit={handleLogHoursSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="log-student" style={{ fontSize: 14, fontWeight: 700, color: '#18203A' }}>
                  Ambassador
                </label>
                <select
                  id="log-student"
                  value={logStudentId}
                  onChange={(e) => setLogStudentId(e.target.value)}
                  style={{
                    height: 44,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: '1.5px solid #C3C9D6',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    background: '#FFFFFF'
                  }}
                  required
                >
                  <option value="" disabled>Select an ambassador...</option>
                  {ambassadorsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.countryName}) — {a.loggedHours || 0} hrs logged
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="log-date" style={{ fontSize: 14, fontWeight: 700, color: '#18203A' }}>
                    Date
                  </label>
                  <input
                    id="log-date"
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    style={{
                      height: 44,
                      padding: '0 12px',
                      borderRadius: 10,
                      border: '1.5px solid #C3C9D6',
                      fontSize: 14,
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="log-hours-input" style={{ fontSize: 14, fontWeight: 700, color: '#18203A' }}>
                    Hours
                  </label>
                  <input
                    id="log-hours-input"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="40"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    style={{
                      height: 44,
                      padding: '0 12px',
                      borderRadius: 10,
                      border: '1.5px solid #C3C9D6',
                      fontSize: 14,
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="log-what" style={{ fontSize: 14, fontWeight: 700, color: '#18203A' }}>
                  What did they do?
                </label>
                <textarea
                  id="log-what"
                  rows={3}
                  value={logWhat}
                  onChange={(e) => setLogWhat(e.target.value)}
                  placeholder="e.g. Guided new students through city centre tour, welcomed attendees at campus hall..."
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: '1.5px solid #C3C9D6',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  style={{
                    height: 42,
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
                  type="submit"
                  disabled={submittingLog}
                  style={{
                    height: 42,
                    padding: '0 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#B42318',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: submittingLog ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submittingLog ? 'Saving...' : 'Save hours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
