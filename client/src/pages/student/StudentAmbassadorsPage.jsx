import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export function StudentAmbassadorsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [why, setWhy] = useState('');
  const [languages, setLanguages] = useState('');
  const [hoursPerMonth, setHoursPerMonth] = useState('4_to_8');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    async function fetchAmbassadors() {
      try {
        const res = await api.get('/me/ambassadors');
        setData(res);
      } catch (err) {
        console.error('Failed to load ambassador details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAmbassadors();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!why.trim() || !languages.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post('/me/ambassadors/apply', {
        why,
        languages,
        hoursPerMonth
      });
      if (res?.ok) {
        setData((prev) => ({
          ...prev,
          application: res.application
        }));
        toast.show('Ambassador application submitted successfully!');
      }
    } catch (err) {
      const msg = err.fields ? Object.values(err.fields).join(' ') : (err.message || 'Failed to submit application');
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="36px" width="220px" />
        <Skeleton height="260px" style={{ borderRadius: '20px' }} />
      </div>
    );
  }

  const app = data?.application;
  const isApproved = Boolean(app?.status === 'approved' || app?.status === 'accepted' || data?.isAmbassador);
  const isPending = Boolean(app?.status === 'pending' || app?.status === 'applied');
  const loggedHours = data?.loggedHours || 0;
  const requiredHours = data?.requiredHoursForCertificate || 20;
  const history = data?.volunteeringHistory || [];
  const certificateLine = data?.certificateLine || 'Official volunteering certificate from the University of Craiova';

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
          Ambassadors
        </h1>
        <p style={{ margin: 0, fontSize: '17px', color: '#4A536B' }}>
          Apply to be an ambassador and follow your application.
        </p>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {isApproved ? (
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '24px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#E8F5EE',
                  color: '#1E7B4C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Award size={28} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '24px',
                    color: '#18203A'
                  }}
                >
                  UCV International Ambassador
                </span>
                <span style={{ fontSize: '15px', color: '#17633D', fontWeight: 600 }}>
                  Active for the 2026–2027 Academic Year
                </span>
              </div>
            </div>

            {/* Hours tracker */}
            <div
              style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: '#F2F3F6',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#18203A' }}>
                  Volunteering hours
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', color: '#B42318' }}>
                  {loggedHours} / {requiredHours} hours
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '10px', borderRadius: '999px', backgroundColor: '#D9DDE6', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (loggedHours / requiredHours) * 100)}%`,
                    backgroundColor: '#1E7B4C',
                    borderRadius: '999px',
                    transition: 'width 300ms ease'
                  }}
                />
              </div>

              <span style={{ fontSize: '14px', color: '#4A536B' }}>
                Reach {requiredHours} hours to receive your {certificateLine}.
              </span>
            </div>

            {/* Volunteering history */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '17px', color: '#18203A' }}>
                Activity log
              </span>
              {history.length === 0 ? (
                <span style={{ fontSize: '14px', color: '#4A536B' }}>
                  No hours logged by coordinator yet.
                </span>
              ) : (
                history.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#F2F3F6',
                      fontSize: '14px'
                    }}
                  >
                    <span>{h.whatDidTheyDo || 'Volunteering event'}</span>
                    <span style={{ fontWeight: 700, color: '#18203A' }}>+{h.hours} hrs</span>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : isPending ? (
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '24px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={28} color="#E0A200" />
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '22px',
                  color: '#18203A'
                }}
              >
                Application under review
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '16px', lineHeight: '24px', color: '#2E3650' }}>
              Thank you for applying to be an ambassador! The International Relations Department has received your application and will contact you soon for a short friendly chat.
            </p>
          </section>
        ) : (
          /* Application Form */
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '24px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                Ambassador application
              </h2>
              <span style={{ fontSize: '15px', color: '#4A536B' }}>
                Takes 2 minutes. Open to all students at the University of Craiova.
              </span>
            </div>

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                  Why would you like to be an ambassador? <span style={{ fontSize: '13px', fontWeight: 400, color: '#4A536B' }}>(minimum 10 characters)</span>
                </label>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  rows={4}
                  placeholder="Tell us what you'd like to help with and why we should choose you as an ambassador."
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #C3C9D6',
                    fontSize: '15px',
                    lineHeight: '22px',
                    color: '#18203A',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                  What languages do you speak?
                </label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. English, Spanish, basic Romanian"
                  style={{
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #C3C9D6',
                    fontSize: '15px',
                    color: '#18203A'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                  How many hours per month can you offer?
                </label>
                <select
                  value={hoursPerMonth}
                  onChange={(e) => setHoursPerMonth(e.target.value)}
                  style={{
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #C3C9D6',
                    fontSize: '15px',
                    color: '#18203A'
                  }}
                >
                  <option value="2_to_4">2 to 4 hours per month</option>
                  <option value="4_to_8">4 to 8 hours per month</option>
                  <option value="more_than_8">More than 8 hours per month</option>
                </select>
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#FEE4E2',
                    border: '1px solid #FECDCA',
                    color: '#B42318',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !why.trim() || !languages.trim()}
                style={{
                  alignSelf: 'flex-start',
                  height: '48px',
                  padding: '0 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#B42318',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: submitting || !why.trim() || !languages.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !why.trim() || !languages.trim() ? 0.6 : 1,
                  marginTop: '6px'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
