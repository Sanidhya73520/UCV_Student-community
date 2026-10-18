import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { getSemestersList } from '../../../../shared/semesters.js';

export function StaffReportsPage() {
  const semesters = getSemestersList();
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]?.id || 'autumn-2026');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async (semId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/staff/reports/summary?semester=${semId}`);
      setReport(res);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedSemester);
  }, [selectedSemester]);

  const handleDownloadPdf = () => {
    window.location.href = `/api/staff/reports/semester-summary.pdf?semester=${selectedSemester}`;
  };

  const handleDownloadExcel = (endpoint) => {
    window.location.href = `/api/staff/reports/${endpoint}/excel?semester=${selectedSemester}`;
  };

  const handleDownloadActivityExcel = (actId) => {
    window.location.href = `/api/staff/activities/${actId}/export`;
  };

  const moreReports = [
    {
      id: 'countries-faculties',
      title: 'Countries and faculties',
      desc: 'Where students come from and what they study'
    },
    {
      id: 'engagement',
      title: 'Engagement',
      desc: "Who joins activities, who hasn't attended yet"
    },
    {
      id: 'questions',
      title: 'Questions',
      desc: 'How many, common topics, answer time'
    },
    {
      id: 'clubs',
      title: 'Club interest',
      desc: 'Upvotes, proposals, volunteers'
    },
    {
      id: 'ambassadors',
      title: 'Ambassadors',
      desc: 'Applications, active ambassadors'
    }
  ];

  return (
    <div className="staff-page-container">
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
            Reports
          </h1>
          <span style={{ fontSize: 15, color: '#4A536B' }}>
            Built from the platform's data.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label htmlFor="semester-select" style={{ fontSize: 15, fontWeight: 700, color: '#18203A' }}>
              Period
            </label>
            <select
              id="semester-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{
                width: 220,
                height: 44,
                padding: '0 14px',
                border: '1.5px solid #C3C9D6',
                borderRadius: 10,
                background: '#FFFFFF',
                fontFamily: 'inherit',
                fontSize: 15,
                color: '#18203A',
                cursor: 'pointer'
              }}
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            id="download-semester-summary-pdf"
            onClick={handleDownloadPdf}
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
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M5 20h14" />
            </svg>
            Semester summary (PDF)
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: '#FBEAE8', color: '#8F1B12', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* 4 KPI Cards (Screen 48) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DDE6', borderRadius: 20, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, color: '#4A536B' }}>Students registered</span>
          <span style={{ fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif", fontWeight: 800, fontSize: 34 }}>
            {loading ? '…' : (report?.studentsRegistered ?? report?.totalStudents ?? 0)}
          </span>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DDE6', borderRadius: 20, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, color: '#4A536B' }}>Countries</span>
          <span style={{ fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif", fontWeight: 800, fontSize: 34 }}>
            {loading ? '…' : (report?.countriesCount ?? 0)}
          </span>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DDE6', borderRadius: 20, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, color: '#4A536B' }}>Activities held</span>
          <span style={{ fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif", fontWeight: 800, fontSize: 34 }}>
            {loading ? '…' : (report?.activitiesHeld ?? 0)}
          </span>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DDE6', borderRadius: 20, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, color: '#4A536B' }}>Total "going" answers</span>
          <span style={{ fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif", fontWeight: 800, fontSize: 34 }}>
            {loading ? '…' : (report?.totalGoingAnswers ?? 0)}
          </span>
        </div>
      </div>

      {/* Main Split Sections */}
      <div className="staff-reports-layout">
        {/* Activity Report Section */}
        <section
          style={{
            flex: '1 1 540px',
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
            Activity report
          </h2>

          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Activity</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Date</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Said going</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#4A536B', borderBottom: '1px solid #D9DDE6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>Loading activities...</td>
                  </tr>
                ) : !report?.activities || report.activities.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>
                      No activities found in this semester.
                    </td>
                  </tr>
                ) : (
                  report.activities.map((act) => {
                    const actDate = act.date ? new Date(act.date) : null;
                    const isFuture = actDate && actDate > new Date();

                    return (
                      <tr key={act.id} style={{ borderBottom: '1px solid #EEF0F4' }}>
                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                          <strong>{act.title}</strong>
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'middle', color: '#4A536B' }}>
                          {actDate ? actDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                          {isFuture ? (
                            <span style={{ color: '#7E879E' }}>Upcoming</span>
                          ) : (
                            <span style={{ fontWeight: 700 }}>{act.goingCount || 0}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadActivityExcel(act.id)}
                            style={{
                              height: 36,
                              padding: '0 12px',
                              borderRadius: 8,
                              fontFamily: 'inherit',
                              fontWeight: 700,
                              fontSize: 13,
                              border: '1.5px solid #C3C9D6',
                              background: '#FFFFFF',
                              color: '#18203A',
                              cursor: 'pointer'
                            }}
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Activities Card List */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>Loading activities...</div>
            ) : !report?.activities || report.activities.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#4A536B' }}>No activities found in this semester.</div>
            ) : (
              report.activities.map((act) => {
                const actDate = act.date ? new Date(act.date) : null;
                const isFuture = actDate && actDate > new Date();

                return (
                  <div
                    key={act.id}
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
                      <div>
                        <strong style={{ fontSize: '15px', color: '#18203A', display: 'block' }}>{act.title}</strong>
                        <span style={{ fontSize: '13px', color: '#4A536B' }}>
                          {actDate ? actDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
                        </span>
                      </div>
                      <span
                        style={{
                          height: 26,
                          padding: '0 10px',
                          borderRadius: 999,
                          backgroundColor: '#E4E9F4',
                          color: '#18203A',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        {isFuture ? 'Upcoming' : `${act.goingCount || 0} going`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadActivityExcel(act.id)}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        padding: '0 14px',
                        borderRadius: 10,
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: 14,
                        border: '1.5px solid #C3C9D6',
                        background: '#FFFFFF',
                        color: '#18203A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      Download Excel
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* More Reports Card (Screen 48) */}
        <section
          style={{
            width: 420,
            flexShrink: 0,
            background: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: 20,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
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
            More reports
          </h2>

          {moreReports.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#F7F8FA'
              }}
            >
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</span>
                <span style={{ fontSize: 13, color: '#4A536B' }}>{item.desc}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadExcel(item.id)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 13,
                  border: '1.5px solid #C3C9D6',
                  background: '#FFFFFF',
                  color: '#18203A',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Excel
              </button>
            </div>
          ))}
        </section>
      </div>

      <style>{`
        .staff-reports-layout {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .staff-reports-layout {
            flex-direction: column !important;
          }
          .staff-reports-layout > section {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
