import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit2, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { TextField } from '../../components/TextField.jsx';
import { Select } from '../../components/Select.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';

export function StaffClubsPage() {
  const { showToast } = useToast();

  const [areas, setAreas] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Open club form
  const [openClubModal, setOpenClubModal] = useState(false);
  const [clubForm, setClubForm] = useState({
    name: '',
    motto: '',
    description: '',
    schedule: '',
    whatsappLink: '',
    status: 'published'
  });
  const [savingClub, setSavingClub] = useState(false);

  // Area modal
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [areaForm, setAreaForm] = useState({
    title: '',
    description: '',
    order: 0,
    status: 'published'
  });
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [savingArea, setSavingArea] = useState(false);

  const fetchClubData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/staff/clubs');
      setAreas(res.areas || []);
      setClubs(res.clubs || []);
      setProposals(res.proposals || []);
    } catch (err) {
      setError(err.message || 'Failed to load clubs data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, []);

  const handleProposalStatusChange = async (proposalId, newStatus) => {
    try {
      await api.patch(`/staff/clubs/proposals/${proposalId}`, { status: newStatus });
      showToast({ message: 'Proposal status updated.', type: 'success' });
      fetchClubData();
    } catch (err) {
      showToast({ message: err.message || 'Failed to update proposal status.', type: 'error' });
    }
  };

  const handleOpenClubSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingClub(true);
      await api.post('/staff/clubs', clubForm);
      showToast({ message: 'Club created successfully.', type: 'success' });
      setOpenClubModal(false);
      setClubForm({
        name: '',
        motto: '',
        description: '',
        schedule: '',
        whatsappLink: '',
        status: 'published'
      });
      fetchClubData();
    } catch (err) {
      showToast({ message: err.message || 'Failed to open club.', type: 'error' });
    } finally {
      setSavingClub(false);
    }
  };

  const handleSaveArea = async (e) => {
    e.preventDefault();
    try {
      setSavingArea(true);
      if (editingAreaId) {
        await api.put(`/staff/clubs/areas/${editingAreaId}`, areaForm);
        showToast({ message: 'Interest area updated.', type: 'success' });
      } else {
        await api.post('/staff/clubs/areas', areaForm);
        showToast({ message: 'Interest area created.', type: 'success' });
      }
      setAreaModalOpen(false);
      setEditingAreaId(null);
      setAreaForm({ title: '', description: '', order: 0, status: 'published' });
      fetchClubData();
    } catch (err) {
      showToast({ message: err.message || 'Failed to save area.', type: 'error' });
    } finally {
      setSavingArea(false);
    }
  };

  const handleDeleteArea = async (areaId, areaTitle) => {
    if (!window.confirm(`Are you sure you want to remove the interest area "${areaTitle}"?\n\nThis will remove it from the landing page and clubs directory.`)) {
      return;
    }
    try {
      await api.delete(`/staff/clubs/areas/${areaId}`);
      showToast({ message: `Interest area "${areaTitle}" removed successfully.`, type: 'info' });
      if (editingAreaId === areaId) {
        setAreaModalOpen(false);
        setEditingAreaId(null);
      }
      fetchClubData();
    } catch (err) {
      showToast({ message: err.message || 'Failed to remove area.', type: 'error' });
    }
  };

  const maxVotes = Math.max(...areas.map((a) => a.upvoteCount || 0), 1);
  const newProposalsCount = proposals.filter((p) => p.status === 'received' || p.status === 'pending').length;

  if (loading) {
    return (
      <div className="staff-page-container">
        <Skeleton height="40px" width="240px" />
        <Skeleton height="400px" />
      </div>
    );
  }

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800 }}>
          Clubs
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
          Interest areas, students' proposals, and clubs once they open.
        </p>
      </header>

      {error && <ErrorAlert message={error} onRetry={fetchClubData} />}

      <div className="staff-clubs-grid">
        {/* Left Column: Interest Areas & Active Clubs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Interest Areas Section */}
          <section className="staff-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Interest areas and upvotes
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '24px',
                  padding: '0 10px',
                  borderRadius: '999px',
                  backgroundColor: '#E4E9F4',
                  color: 'var(--navy)',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                Shows on: Shape our clubs
              </span>
            </div>

            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Area</th>
                    <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Upvotes</th>
                    <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '10px 12px', width: '160px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((a) => {
                    const percent = Math.min(100, Math.round(((a.upvoteCount || 0) / maxVotes) * 100));
                    return (
                      <tr key={a._id || a.id} style={{ borderBottom: '1px solid var(--paper)' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{a.title || a.name}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '120px', height: '8px', borderRadius: '4px', backgroundColor: '#E8F5EE' }}>
                              <div
                                style={{
                                  width: `${percent}%`,
                                  height: '8px',
                                  borderRadius: '4px',
                                  backgroundColor: '#1E7B4C'
                                }}
                              />
                            </div>
                            <strong>{a.upvoteCount || 0}</strong>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: '24px',
                              padding: '0 8px',
                              borderRadius: '999px',
                              backgroundColor: '#E8F5EE',
                              color: '#17633D',
                              fontSize: '12px',
                              fontWeight: 700
                            }}
                          >
                            Published
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAreaId(a._id || a.id);
                                setAreaForm({
                                  title: a.title || a.name,
                                  description: a.description || '',
                                  order: a.order || 0,
                                  status: a.status || (a.isPublished ? 'published' : 'archived')
                                });
                                setAreaModalOpen(true);
                              }}
                              style={{
                                height: '32px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                border: '1.5px solid var(--border)',
                                backgroundColor: 'var(--white)',
                                color: 'var(--navy)',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${a.title || a.name}`}
                              onClick={() => handleDeleteArea(a._id || a.id, a.title || a.name)}
                              style={{
                                height: '32px',
                                padding: '0 8px',
                                borderRadius: '6px',
                                border: '1.5px solid #FCA5A5',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Remove interest area"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Interest Areas */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {areas.map((a) => {
                const percent = Math.min(100, Math.round(((a.upvoteCount || 0) / maxVotes) * 100));
                return (
                  <div
                    key={a._id || a.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{a.title || a.name}</strong>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '22px',
                          padding: '0 8px',
                          borderRadius: '999px',
                          backgroundColor: '#E8F5EE',
                          color: '#17633D',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        Published
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '8px', borderRadius: '4px', backgroundColor: '#D1E7DD' }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '8px',
                            borderRadius: '4px',
                            backgroundColor: '#1E7B4C'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
                        {a.upvoteCount || 0} upvotes
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAreaId(a._id || a.id);
                          setAreaForm({
                            title: a.title || a.name,
                            description: a.description || '',
                            order: a.order || 0,
                            status: a.status || (a.isPublished ? 'published' : 'archived')
                          });
                          setAreaModalOpen(true);
                        }}
                        style={{
                          height: '34px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--navy)',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${a.title || a.name}`}
                        onClick={() => handleDeleteArea(a._id || a.id, a.title || a.name)}
                        style={{
                          height: '34px',
                          padding: '0 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #FCA5A5',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setEditingAreaId(null);
                setAreaForm({ title: '', description: '', order: areas.length, status: 'published' });
                setAreaModalOpen(true);
              }}
              style={{ alignSelf: 'flex-start', marginTop: '4px' }}
            >
              <Plus size={16} />
              Add an interest area
            </Button>
          </section>

          {/* Active Clubs Section */}
          <section className="staff-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Clubs
              </h2>
              <Button onClick={() => setOpenClubModal(true)}>
                <Plus size={16} />
                Open a club
              </Button>
            </div>

            {clubs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {clubs.map((c) => (
                  <div
                    key={c._id || c.id}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{c.name}</strong>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: c.status === 'published' ? '#E8F5EE' : '#EEF0F4',
                          color: c.status === 'published' ? '#17633D' : '#4A536B'
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                    {c.description && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '18px' }}>
                        {c.description}
                      </p>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--navy)', fontWeight: 600, marginTop: '4px' }}>
                      {c.memberCount || 0} members joined
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '2px dashed var(--border)',
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                No clubs yet. A published club appears on Shape our clubs and in the student portal for students to join.
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Student Proposals */}
        <section className="staff-section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
              Proposals from students
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {newProposalsCount} new
            </span>
          </div>

          <span style={{ fontSize: '13px', lineHeight: '18px', color: 'var(--text-muted)' }}>
            The student sees the status you choose under My proposals.
          </span>

          {proposals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {proposals.map((p) => (
                <div
                  key={p._id || p.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--paper)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{p.name}</strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {p.studentName || p.authorName || 'Student'}
                    </span>
                  </div>

                  {p.description && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '18px' }}>
                      {p.description}
                    </p>
                  )}

                  {p.wantsToHelp && (
                    <span style={{ fontSize: '12px', color: 'var(--forest)', fontWeight: 700 }}>
                      Wants to help run it
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <label htmlFor={`prop-${p.id}`} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Status:
                    </label>
                    <select
                      id={`prop-${p.id}`}
                      value={p.status}
                      onChange={(e) => handleProposalStatusChange(p._id || p.id, e.target.value)}
                      style={{
                        height: '34px',
                        padding: '0 10px',
                        border: '1.5px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        backgroundColor: 'var(--white)',
                        color: 'var(--navy)'
                      }}
                    >
                      <option value="received">Received</option>
                      <option value="discussed">Discussed at the meeting</option>
                      <option value="opened">Club opened</option>
                      <option value="not_now">Not now</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No student proposals submitted yet.
            </div>
          )}
        </section>
      </div>

      {/* Open a Club Modal */}
      <Modal isOpen={openClubModal} onClose={() => setOpenClubModal(false)} title="Open a club">
        <form onSubmit={handleOpenClubSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TextField
            label="Club name"
            required
            value={clubForm.name}
            onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
            placeholder="e.g. Board games night"
          />

          <TextField
            label="Short motto (one line)"
            value={clubForm.motto}
            onChange={(e) => setClubForm({ ...clubForm, motto: e.target.value })}
            placeholder="e.g. Strategy, snacks and laughter"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="club-desc" style={{ fontSize: '14px', fontWeight: 700 }}>
              What the club does
            </label>
            <textarea
              id="club-desc"
              rows={3}
              value={clubForm.description}
              onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button variant="outline" type="button" onClick={() => setOpenClubModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingClub}>
              Publish club
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Area Modal */}
      <Modal
        isOpen={areaModalOpen}
        onClose={() => setAreaModalOpen(false)}
        title={editingAreaId ? 'Edit interest area' : 'Add interest area'}
      >
        <form onSubmit={handleSaveArea} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TextField
            label="Title"
            required
            value={areaForm.title}
            onChange={(e) => setAreaForm({ ...areaForm, title: e.target.value })}
            placeholder="e.g. Hiking and Outdoor Adventures"
          />

          <TextField
            label="Description (optional)"
            value={areaForm.description}
            onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: editingAreaId ? 'space-between' : 'flex-end', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
            {editingAreaId && (
              <button
                type="button"
                onClick={() => handleDeleteArea(editingAreaId, areaForm.title)}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #FCA5A5',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} />
                Delete area
              </button>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="outline" type="button" onClick={() => setAreaModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={savingArea}>
                Save area
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <style>{`
        .staff-clubs-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(320px, 1fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .staff-clubs-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
