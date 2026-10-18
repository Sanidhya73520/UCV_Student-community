import React, { useState, useEffect } from 'react';
import { ArrowUp, CheckCircle, ExternalLink } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export function StudentClubsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState('');
  const [clubIdea, setClubIdea] = useState('');
  const [wantsToHelp, setWantsToHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function fetchClubs() {
      try {
        const res = await api.get('/me/clubs');
        setData(res);
      } catch (err) {
        console.error('Failed to load clubs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchClubs();
  }, []);

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!clubName.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/me/clubs/proposals', {
        name: clubName,
        idea: clubIdea,
        wantsToHelp
      });
      if (res?.ok) {
        setData((prev) => ({
          ...prev,
          myProposals: [res.proposal, ...(prev.myProposals || [])]
        }));
        setClubName('');
        setClubIdea('');
        setWantsToHelp(false);
        toast.show('Club proposal submitted!');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to submit proposal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleJoin = async (clubId, isMember, clubName = 'club') => {
    try {
      const endpoint = isMember ? `/me/clubs/${clubId}/leave` : `/me/clubs/${clubId}/join`;
      const res = await api.post(endpoint, {});
      if (res?.ok) {
        toast.show(isMember ? `Withdrawn from ${clubName}.` : `Joined ${clubName}!`);
        setData((prev) => ({
          ...prev,
          openClubs: prev.openClubs.map((c) =>
            c.id === clubId ? { ...c, isMember: !isMember, memberCount: res.memberCount } : c
          )
        }));
      }
    } catch (err) {
      toast.show(err.message || 'Could not update club membership', 'error');
    }
  };

  const handleUpvoteArea = async (areaId) => {
    try {
      const res = await api.post('/public/upvotes/toggle', { clubAreaId: areaId });
      if (res) {
        setData((prev) => ({
          ...prev,
          clubAreas: prev.clubAreas.map((a) =>
            a.id === areaId ? { ...a, isUpvoted: res.upvoted, upvoteCount: res.upvoteCount } : a
          )
        }));
      }
    } catch (err) {
      toast.show(err.message || 'Could not update upvote', 'error');
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

  const openClubs = data?.openClubs || [];
  const myProposals = data?.myProposals || [];
  const clubAreas = data?.clubAreas || [];

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
          Shape our clubs
        </h1>
        <p style={{ margin: 0, fontSize: '17px', color: '#4A536B' }}>
          Help decide which clubs we start.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Column: Active Clubs & Propose Form */}
        <div style={{ flex: '1 1 540px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Clubs */}
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '20px',
              padding: '24px',
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
                fontSize: '22px',
                lineHeight: '28px',
                color: '#18203A'
              }}
            >
              Active clubs
            </h2>

            {openClubs.length === 0 ? (
              <span style={{ fontSize: '15px', color: '#4A536B' }}>
                No clubs are active yet. Propose an idea below to get one started!
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {openClubs.map((club) => (
                  <div
                    key={club.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '18px',
                      borderRadius: '16px',
                      backgroundColor: '#F2F3F6'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '18px', color: '#18203A' }}>
                        {club.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {club.isMember ? (
                          <>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                backgroundColor: '#E8F5EE',
                                color: '#1E7B4C',
                                fontSize: '12px',
                                fontWeight: 700
                              }}
                            >
                              ✓ Joined
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleJoin(club.id, true, club.name)}
                              style={{
                                height: '34px',
                                padding: '0 12px',
                                borderRadius: '8px',
                                border: '1px solid #D9DDE6',
                                backgroundColor: '#FFFFFF',
                                color: '#B42318',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEE4E2';
                                e.currentTarget.style.borderColor = '#FDA29B';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#D9DDE6';
                              }}
                            >
                              Withdraw from club
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleJoin(club.id, false, club.name)}
                            style={{
                              height: '34px',
                              padding: '0 16px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#1E7B4C',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            Join club
                          </button>
                        )}
                      </div>
                    </div>

                    {club.motto && (
                      <span style={{ fontSize: '14px', fontStyle: 'italic', color: '#B42318' }}>
                        {club.motto}
                      </span>
                    )}

                    <p style={{ margin: 0, fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
                      {club.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#4A536B', marginTop: '4px' }}>
                      <span>{club.frequency || 'Regular meetups'}</span>
                      <span>{club.memberCount} members</span>
                    </div>

                    {club.isMember && club.whatsappUrl && (
                      <a
                        href={club.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          alignSelf: 'flex-start',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '6px',
                          color: '#1E7B4C',
                          fontWeight: 700,
                          fontSize: '14px',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={14} />
                        Join WhatsApp group
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Propose a Club Form */}
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
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
              Propose a club
            </h2>

            <form onSubmit={handlePropose} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Club name (e.g. Craiova Board Games)"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                style={{ height: '44px', padding: '0 14px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '15px' }}
              />
              <textarea
                placeholder="Tell us what you'd do and how often"
                rows={3}
                value={clubIdea}
                onChange={(e) => setClubIdea(e.target.value)}
                style={{ minHeight: '80px', padding: '12px 14px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '15px', resize: 'none' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#18203A', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={wantsToHelp}
                  onChange={(e) => setWantsToHelp(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#B42318' }}
                />
                I'd like to help run it
              </label>
              <button
                type="submit"
                disabled={submitting || !clubName.trim()}
                style={{
                  alignSelf: 'flex-start',
                  height: '44px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#B42318',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Submit proposal
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Your Proposals & Area Upvotes */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Your Proposals */}
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
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
              Your proposals
            </h2>

            {myProposals.length === 0 ? (
              <span style={{ fontSize: '14px', color: '#4A536B' }}>
                You haven't proposed any clubs yet.
              </span>
            ) : (
              myProposals.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F2F3F6'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#18203A' }}>
                    {p.name}
                  </span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '999px',
                      backgroundColor: p.status === 'launched' ? '#E8F5EE' : '#FDF3D3',
                      color: p.status === 'launched' ? '#17633D' : '#5C4A00',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'capitalize'
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </section>

          {/* Upvote Areas */}
          <section
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D9DDE6',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
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
              Upvote club areas
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {clubAreas.map((area) => (
                <div
                  key={area.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F2F3F6'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#18203A' }}>
                    {area.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpvoteArea(area.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '999px',
                      border: '1.5px solid #1E7B4C',
                      backgroundColor: area.isUpvoted ? '#1E7B4C' : '#E8F5EE',
                      color: area.isUpvoted ? '#FFFFFF' : '#17633D',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowUp size={12} strokeWidth={2.6} />
                    {area.upvoteCount}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
