import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Mail,
  Edit2,
  Trash2,
  ShieldAlert,
  CheckCircle,
  X,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { TextField } from '../../components/TextField.jsx';
import { Select } from '../../components/Select.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { COUNTRIES } from '../../../../shared/countries.js';
import { UCV_FACULTIES, STUDENT_PROGRAMME_OPTIONS, getProgrammeLabel } from '../../../../shared/faculties.js';

const faculties = UCV_FACULTIES;

export function StaffStudentsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [ambassadorsOnly, setAmbassadorsOnly] = useState(false);

  // Selected student for detail drawer
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    country: 'RO',
    faculty: '',
    programme: 'erasmus_exchange',
    sendInvite: true
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        status: 'approved'
      });
      if (search.trim()) params.append('search', search.trim());
      if (selectedCountry) params.append('country', selectedCountry);

      const res = await api.get(`/staff/students?${params.toString()}`);
      let list = res.students || [];

      // Client-side faculty, programme, ambassador filters if needed
      if (selectedFaculty) {
        list = list.filter((s) => s.faculty === selectedFaculty);
      }
      if (selectedProgramme) {
        list = list.filter((s) => s.programme === selectedProgramme);
      }
      if (ambassadorsOnly) {
        list = list.filter((s) => s.isAmbassador || s.ambassadorStatus === 'accepted');
      }

      setStudents(list);
      setTotal(res.total || list.length);
      setTotalPages(res.totalPages || 1);

      if (list.length > 0 && !selectedStudent) {
        setSelectedStudent(list[0]);
      } else if (list.length > 0 && selectedStudent) {
        // keep selection or update
        const updated = list.find((s) => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [page, search, selectedCountry, selectedFaculty, selectedProgramme, ambassadorsOnly]);

  const handleOpenAddModal = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      country: 'ES',
      faculty: '',
      programme: 'erasmus_exchange',
      sendInvite: true
    });
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/staff/students', formData);
      const emailNote = formData.email ? ' Invitation email sent with password setup link.' : '';
      showToast({ message: `${formData.fullName} added successfully.${emailNote}`, type: 'success' });
      setAddModalOpen(false);
      fetchStudents();
    } catch (err) {
      showToast({ message: err.message || 'Failed to add student.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (student) => {
    setFormData({
      fullName: student.fullName,
      email: student.email,
      mobile: student.mobile || '',
      country: student.countryCode,
      faculty: student.faculty || '',
      programme: student.programme || 'erasmus_exchange'
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      setSaving(true);
      await api.patch(`/staff/students/${selectedStudent.id}`, {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        countryCode: formData.country,
        faculty: formData.faculty,
        programme: formData.programme
      });
      showToast({ message: 'Student updated.', type: 'success' });
      setEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      showToast({ message: err.message || 'Failed to update student.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (deleteConfirmEmail.trim().toLowerCase() !== (selectedStudent.email || '').toLowerCase()) {
      showToast({ message: 'Email does not match. Deletion cancelled.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      await api.delete(`/staff/students/${selectedStudent.id}`, {
        confirmEmail: deleteConfirmEmail.trim()
      });
      showToast({ message: `Student data deleted for ${selectedStudent.fullName}.`, type: 'info' });
      setDeleteModalOpen(false);
      setDeleteConfirmEmail('');
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      showToast({ message: err.message || 'Failed to delete student.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };


  const programmeLabels = {
    erasmus_exchange: 'Erasmus+ exchange',
    erasmus_traineeship: 'Erasmus+ traineeship',
    full_degree: 'Full degree',
    other: 'Other'
  };

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800 }}>
            Students
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
            {total} approved community members.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Button onClick={handleOpenAddModal}>
            <Plus size={18} strokeWidth={2.5} />
            Add student
          </Button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
            aria-label="Search by name or email"
            placeholder="Search by name or email"
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

        <select
          aria-label="Country"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          style={{
            height: '44px',
            padding: '0 12px',
            border: '1.5px solid var(--border)',
            borderRadius: '10px',
            backgroundColor: 'var(--white)',
            fontFamily: 'inherit',
            fontSize: '14px',
            color: 'var(--navy)',
            minWidth: '140px'
          }}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Faculty"
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          style={{
            height: '44px',
            padding: '0 12px',
            border: '1.5px solid var(--border)',
            borderRadius: '10px',
            backgroundColor: 'var(--white)',
            fontFamily: 'inherit',
            fontSize: '14px',
            color: 'var(--navy)',
            minWidth: '140px'
          }}
        >
          <option value="">All faculties</option>
          {faculties.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select
          aria-label="Programme"
          value={selectedProgramme}
          onChange={(e) => setSelectedProgramme(e.target.value)}
          style={{
            height: '44px',
            padding: '0 12px',
            border: '1.5px solid var(--border)',
            borderRadius: '10px',
            backgroundColor: 'var(--white)',
            fontFamily: 'inherit',
            fontSize: '14px',
            color: 'var(--navy)',
            minWidth: '140px'
          }}
        >
          <option value="">All programmes</option>
          <option value="erasmus_exchange">Erasmus+ exchange</option>
          <option value="erasmus_traineeship">Erasmus+ traineeship</option>
          <option value="full_degree">Full degree</option>
          <option value="other">Other</option>
        </select>

        {/* <button
          type="button"
          aria-pressed={ambassadorsOnly}
          onClick={() => setAmbassadorsOnly(!ambassadorsOnly)}
          style={{
            height: '44px',
            padding: '0 16px',
            borderRadius: '999px',
            border: ambassadorsOnly ? '1.5px solid var(--navy)' : '1.5px solid var(--border)',
            backgroundColor: ambassadorsOnly ? 'var(--navy)' : 'var(--white)',
            color: ambassadorsOnly ? 'var(--white)' : 'var(--navy)',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Ambassadors only
        </button> */}
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchStudents} />}

      {/* Main Container: Table & Detail Drawer */}
      <div className="staff-students-layout" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Table Section */}
        <section
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Skeleton height="44px" />
              <Skeleton height="44px" />
              <Skeleton height="44px" />
              <Skeleton height="44px" />
            </div>
          ) : students.length > 0 ? (
            <>
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F7F8FA', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Name</th>
                      <th style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Country</th>
                      <th style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Faculty</th>
                      <th style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Programme</th>
                      <th style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
                        Events
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const isSelected = selectedStudent?.id === s.id;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedStudent(s)}
                          style={{
                            backgroundColor: isSelected ? '#E4E9F4' : 'transparent',
                            borderBottom: '1px solid var(--paper)',
                            cursor: 'pointer',
                            transition: 'background-color 150ms'
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--navy)' }}>
                            {s.fullName}
                          </td>
                          <td style={{ padding: '12px 14px' }}>{s.countryName || s.countryCode}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{s.faculty || '—'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            {programmeLabels[s.programme] || s.programme || '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
                            {s.eventsCount || 1}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards List */}
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                {students.map((s) => {
                  const isSelected = selectedStudent?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      role="button"
                      tabIndex={0}
                      style={{
                        backgroundColor: isSelected ? '#E4E9F4' : 'var(--white)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(24, 32, 58, 0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)' }}>{s.fullName}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.countryName || s.countryCode}</div>
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#E4E9F4',
                            color: 'var(--navy)',
                            flexShrink: 0
                          }}
                        >
                          {s.eventsCount || 1} {(s.eventsCount || 1) === 1 ? 'event' : 'events'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{s.faculty || 'No faculty'}</span>
                        <span>•</span>
                        <span>{programmeLabels[s.programme] || s.programme || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{
                      height: '40px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--white)',
                      color: page <= 1 ? 'var(--text-muted)' : 'var(--navy)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      height: '40px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--navy)',
                      backgroundColor: 'var(--white)',
                      color: page >= totalPages ? 'var(--text-muted)' : 'var(--navy)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No students found matching current filters.
            </div>
          )}
        </section>

        {/* Selected Student Detail Drawer */}
        {selectedStudent && (
          <>
            <div
              className="mobile-only"
              onClick={() => setSelectedStudent(null)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(24, 32, 58, 0.6)',
                zIndex: 998,
                animation: 'fadeIn 150ms ease'
              }}
            />
            <aside
              className="student-detail-drawer"
              aria-label="Selected student details"
              style={{
                width: '340px',
                flexShrink: 0,
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {/* Header info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--marigold)',
                      color: 'var(--navy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '19px',
                      flexShrink: 0
                    }}
                  >
                    {selectedStudent.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                      {selectedStudent.fullName}
                    </h2>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      {selectedStudent.countryName || selectedStudent.countryCode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  aria-label="Close details"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--navy)',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

            {/* DL list */}
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <dt style={{ color: 'var(--text-muted)' }}>Faculty</dt>
                <dd style={{ margin: 0, fontWeight: 700, textAlign: 'right' }}>
                  {selectedStudent.faculty || 'Not specified'}
                </dd>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <dt style={{ color: 'var(--text-muted)' }}>Programme</dt>
                <dd style={{ margin: 0, fontWeight: 700, textAlign: 'right' }}>
                  {programmeLabels[selectedStudent.programme] || selectedStudent.programme || '—'}
                </dd>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <dt style={{ color: 'var(--text-muted)' }}>Email</dt>
                <dd style={{ margin: 0, fontWeight: 700, textAlign: 'right', wordBreak: 'break-all' }}>
                  {selectedStudent.email || 'No email registered'}
                </dd>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <dt style={{ color: 'var(--text-muted)' }}>Mobile number</dt>
                <dd style={{ margin: 0, fontWeight: 700, textAlign: 'right' }}>
                  {selectedStudent.mobile || '—'}
                </dd>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <dt style={{ color: 'var(--text-muted)' }}>Ambassador</dt>
                <dd style={{ margin: 0, fontWeight: 700, textAlign: 'right' }}>
                  {selectedStudent.isAmbassador ? 'Active Ambassador' : 'Not applied'}
                </dd>
              </div>
            </dl>

            {/* Clubs joined */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Clubs</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedStudent.clubs && selectedStudent.clubs.length > 0 ? (
                  selectedStudent.clubs.map((club, idx) => {
                    const clubName = typeof club === 'string' ? club : club.name;
                    return (
                      <span
                        key={club.id || club._id || idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '28px',
                          padding: '0 10px',
                          borderRadius: '999px',
                          backgroundColor: '#E4E9F4',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        {clubName}
                      </span>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None</span>
                )}
              </div>
            </div>

            {/* Consent Notice */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                padding: '12px',
                backgroundColor: 'var(--paper)',
                borderRadius: '12px',
                fontSize: '13px',
                lineHeight: '18px',
                color: 'var(--navy)'
              }}
            >
              <CheckCircle size={16} color="var(--forest)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Agreed to data use on{' '}
                {selectedStudent.approvedAt
                  ? new Date(selectedStudent.approvedAt).toLocaleDateString('en-GB')
                  : '21 October 2026'}
                . Contact details are visible to staff only.
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {/* <a
                href={selectedStudent.email ? `mailto:${selectedStudent.email}` : '#'}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-red)',
                  color: 'var(--white)',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
              >
                Send message
              </a> */}
              
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedStudent)}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--navy)',
                  backgroundColor: 'var(--white)',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>

            {/* Admin Delete Data Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                style={{
                  height: '40px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--brand-red)',
                  backgroundColor: 'var(--white)',
                  color: 'var(--brand-red)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
              >
                <Trash2 size={16} />
                Delete student data
              </button>
            )}
          </aside>
        </>
      )}
    </div>

    <style>{`
      @media (max-width: 900px) {
        .staff-students-layout {
          flex-direction: column !important;
        }
        .student-detail-drawer {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-height: 85svh !important;
          overflow-y: auto !important;
          z-index: 1000 !important;
          border-radius: 24px 24px 0 0 !important;
          box-shadow: 0 -4px 32px rgba(24, 32, 58, 0.25) !important;
          animation: slideUpSheet 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
      }
    `}</style>

      {/* Add Student Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add student">
        <form onSubmit={handleSaveAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Full name"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Maria Popescu"
          />

          <div>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="maria@example.com"
            />
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              An invitation email will be sent with a secure link allowing the student to choose a password and activate their account.
            </p>
          </div>

          <TextField
            label="Mobile number"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            placeholder="+40 700 000 000"
          />

          <Select
            label="Country"
            required
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
          />

          <Select
            label="Faculty"
            value={formData.faculty}
            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
            options={[{ value: '', label: 'Select faculty' }, ...faculties.map((f) => ({ value: f, label: f }))]}
          />

          <Select
            label="Programme"
            value={formData.programme}
            onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
            options={[
              { value: 'erasmus_exchange', label: 'Erasmus+ exchange' },
              { value: 'erasmus_traineeship', label: 'Erasmus+ traineeship' },
              { value: 'full_degree', label: 'Full degree' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit student">
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Full name"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <TextField
            label="Mobile number"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          />

          <Select
            label="Country"
            required
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
          />

          <Select
            label="Faculty"
            value={formData.faculty}
            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
            options={[{ value: '', label: 'Select faculty' }, ...faculties.map((f) => ({ value: f, label: f }))]}
          />

          <Select
            label="Programme"
            value={formData.programme}
            onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
            options={[
              { value: 'erasmus_exchange', label: 'Erasmus+ exchange' },
              { value: 'erasmus_traineeship', label: 'Erasmus+ traineeship' },
              { value: 'full_degree', label: 'Full degree' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Student Confirmation Modal (Admin only, SPEC §4.14) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete student data"
      >
        <form onSubmit={handleDeleteStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FBEAE8',
              borderRadius: '10px',
              color: 'var(--brand-red)',
              fontSize: '14px',
              lineHeight: '20px'
            }}
          >
            <strong>Warning:</strong> This permanently deletes all account records, wall posts, RSVPs, club memberships, and submitted words for{' '}
            <strong>{selectedStudent?.fullName}</strong>. This cannot be undone.
          </div>

          <p style={{ margin: 0, fontSize: '14px', color: 'var(--navy)' }}>
            To confirm deletion, please type the student's email address (
            <strong>{selectedStudent?.email}</strong>) below:
          </p>

          <TextField
            label="Confirm email"
            required
            value={deleteConfirmEmail}
            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            placeholder={selectedStudent?.email || ''}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              style={{ backgroundColor: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}
              disabled={deleteConfirmEmail.trim().toLowerCase() !== (selectedStudent?.email || '').toLowerCase()}
              loading={saving}
            >
              Permanently delete data
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
