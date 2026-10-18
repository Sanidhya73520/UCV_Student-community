import React, { useState, useEffect } from 'react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { UCV_FACULTIES, STUDENT_PROGRAMME_OPTIONS, getProgrammeLabel } from '../../../../shared/faculties.js';

export function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState('');
  const [faculty, setFaculty] = useState('');
  const [programme, setProgramme] = useState('erasmus_exchange');
  const [prefs, setPrefs] = useState({
    newActivities: true,
    questionAnswers: true,
    communityUpdates: true
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get('/me/profile');
        setProfile(res);
        setMobile(res.mobile || '');
        setFaculty(res.faculty || '');
        setProgramme(res.programme || 'erasmus_exchange');
        if (res.notificationPrefs) {
          setPrefs(res.notificationPrefs);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/me/profile', {
        mobile,
        faculty,
        programme,
        notificationPrefs: prefs
      });
      if (res?.ok) {
        setProfile((prev) => ({
          ...prev,
          faculty: res.faculty,
          programme: res.programme,
          mobile: res.mobile
        }));
        toast.show('Profile updated successfully!');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="36px" width="220px" />
        <Skeleton height="300px" style={{ borderRadius: '20px' }} />
      </div>
    );
  }

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
          My profile
        </h1>
        <p style={{ margin: 0, fontSize: '17px', color: '#4A536B' }}>
          Your registered details and how we contact you.
        </p>
      </div>

      <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Read-only Registered Info */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '20px',
              color: '#18203A'
            }}
          >
            Registered details
          </h2>

          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '15px' }}>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Full name</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {profile?.fullName}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>University email</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {profile?.email}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Country</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {profile?.countryName}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Programme</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {getProgrammeLabel(profile?.programme)}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Faculty / Centre</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {profile?.faculty || 'Not set'}
              </dd>
            </div>
          </dl>

          <span style={{ fontSize: '13px', color: '#8E99B7', paddingTop: '8px', borderTop: '1px solid #F0F2F6' }}>
            Name and university email cannot be changed online. To request an identity change, please send a message under "Ask the coordinator".
          </span>
        </section>

        {/* Editable preferences */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '20px',
              color: '#18203A'
            }}
          >
            Academic Details & Contact
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="profile-faculty-select" style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                Faculty / Centre
              </label>
              <select
                id="profile-faculty-select"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                style={{
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #C3C9D6',
                  fontSize: '14px',
                  color: '#18203A',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select your faculty / centre…</option>
                {UCV_FACULTIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="profile-programme-select" style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                Study Programme
              </label>
              <select
                id="profile-programme-select"
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                style={{
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #C3C9D6',
                  fontSize: '14px',
                  color: '#18203A',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                {STUDENT_PROGRAMME_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                Mobile number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+40 712 345 678"
                style={{
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #C3C9D6',
                  fontSize: '15px',
                  color: '#18203A'
                }}
              />
              <span style={{ fontSize: '13px', color: '#4A536B' }}>
                Used strictly by the International Relations team in emergencies.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                Email notifications
              </span>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#18203A', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.newActivities}
                  onChange={(e) => setPrefs({ ...prefs, newActivities: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#B42318' }}
                />
                Notify me when new activities are announced
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#18203A', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.questionAnswers}
                  onChange={(e) => setPrefs({ ...prefs, questionAnswers: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#B42318' }}
                />
                Notify me when the coordinator answers my question
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#18203A', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prefs.communityUpdates}
                  onChange={(e) => setPrefs({ ...prefs, communityUpdates: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#B42318' }}
                />
                Receive monthly community updates and highlights
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                alignSelf: 'flex-start',
                height: '46px',
                padding: '0 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#B42318',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
