import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, RotateCcw, Trash2, Info, Edit2, X, Check } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { useWallSync, broadcastWallUpdate } from '../../lib/wallSync.js';

export function StaffModerationPage() {
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const [tab, setTab] = useState('everything'); // 'everything' | 'wall' | 'word' | 'removed'
  const [search, setSearch] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchModeration = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/staff/moderation');
      const itemsList = res.items || [
        ...(res.wallPosts || []).map((p) => ({
          ...p,
          type: 'wall',
          authorName: p.authorName || p.author,
          authorCountry: p.authorCountry || p.countryName,
          status: p.status || p.state || 'visible'
        })),
        ...(res.sharedWords || []).map((w) => ({
          ...w,
          type: 'word',
          authorName: w.authorName || w.author,
          authorCountry: w.authorCountry || w.countryName,
          text: w.text || `${w.language ? `${w.language}: ` : ''}${w.meaning || ''}`,
          status: w.status || w.state || 'visible'
        }))
      ];
      setItems(itemsList);
    } catch (err) {
      setError(err.message || 'Failed to load moderation content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModeration();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && editingItem) {
        setEditingItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingItem]);

  // Real-time synchronization across staff and student actions
  useWallSync({
    onUpdate: (evt) => {
      // Don't refetch if currently editing in modal
      if (!editingItem) {
        fetchModeration();
      }
    },
    onRefresh: () => {
      if (!editingItem) {
        fetchModeration();
      }
    }
  });

  const handleRemove = async (item) => {
    try {
      setActionLoading((prev) => ({ ...prev, [item.id]: true }));
      await api.post(`/staff/moderation/${item.type}/${item.id}/remove`);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'removed', state: 'removed' } : i))
      );
      broadcastWallUpdate({ action: 'remove', postId: item.id });
      showToast({
        message: 'Content removed from public view.',
        type: 'info',
        action: {
          label: 'Undo',
          onClick: async () => {
            await handleRestore(item);
          }
        }
      });
    } catch (err) {
      showToast({ message: err.message || 'Failed to remove content.', type: 'error' });
      fetchModeration();
    } finally {
      setActionLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleRestore = async (item) => {
    try {
      setActionLoading((prev) => ({ ...prev, [item.id]: true }));
      await api.post(`/staff/moderation/${item.type}/${item.id}/restore`);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'visible', state: 'visible' } : i))
      );
      broadcastWallUpdate({ action: 'restore', postId: item.id });
      showToast({ message: 'Content restored to public view.', type: 'success' });
    } catch (err) {
      showToast({ message: err.message || 'Failed to restore content.', type: 'error' });
      fetchModeration();
    } finally {
      setActionLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleDelete = async (item) => {
    const isWall = item.type === 'wall';
    const label = isWall ? 'wall answer' : 'word';
    if (!window.confirm(`Permanently delete this ${label} by ${item.authorName}? This will remove it from the database and cannot be undone.`)) {
      return;
    }
    try {
      setActionLoading((prev) => ({ ...prev, [item.id]: true }));
      await api.delete(`/staff/moderation/${item.type}/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      broadcastWallUpdate({ action: 'delete', postId: item.id });
      showToast({ message: `${isWall ? 'Wall answer' : 'Word'} permanently deleted.`, type: 'success' });
    } catch (err) {
      showToast({ message: err.message || 'Failed to delete content.', type: 'error' });
      fetchModeration();
    } finally {
      setActionLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem || !editText.trim()) return;
    setEditSaving(true);
    try {
      await api.put(`/staff/moderation/wall/${editingItem.id}`, { text: editText.trim() });
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, text: editText.trim() } : i))
      );
      broadcastWallUpdate({ action: 'update', postId: editingItem.id, text: editText.trim() });
      showToast({ message: 'Wall answer updated successfully.', type: 'success' });
      setEditingItem(null);
      setEditText('');
    } catch (err) {
      showToast({ message: err.message || 'Failed to update wall answer.', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (tab === 'wall' && item.type !== 'wall') return false;
    if (tab === 'word' && item.type !== 'word') return false;
    if (tab === 'removed' && item.status !== 'removed') return false;
    if (tab !== 'removed' && item.status === 'removed') return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (item.authorName || '').toLowerCase().includes(term) ||
      (item.text || '').toLowerCase().includes(term) ||
      (item.authorCountry || '').toLowerCase().includes(term)
    );
  });

  const tabs = [
    { id: 'everything', label: 'Everything' },
    { id: 'wall', label: 'Wall answers' },
    { id: 'word', label: 'Words' },
    { id: 'removed', label: 'Removed' }
  ];

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800 }}>
          International Wall
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
          Student posts and answers on the International Wall. Review submissions, update text, or remove content breaking community guidelines.
        </p>
      </header>

      {error && <ErrorAlert message={error} onRetry={fetchModeration} />}

      {/* Main Table Card */}
      <section className="staff-section-card">
        {/* Controls: Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div role="tablist" aria-label="Show moderation filters" className="horizontal-scroll-row" style={{ display: 'flex', gap: '6px' }}>
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
              aria-label="Search moderation"
              placeholder="Search by student or text"
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

        {/* Content Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
            <Skeleton height="50px" />
            <Skeleton height="50px" />
            <Skeleton height="50px" />
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', width: '180px' }}>
                    Student
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', width: '90px' }}>
                    Type
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Post
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', width: '120px' }}>
                    When
                  </th>
                  <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', width: '220px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isRemoved = item.status === 'removed';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--paper)' }}>
                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <strong style={{ display: 'block', color: 'var(--navy)' }}>{item.authorName}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.authorCountry}</span>
                      </td>

                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '24px',
                            padding: '0 8px',
                            borderRadius: '999px',
                            backgroundColor: '#E4E9F4',
                            color: 'var(--navy)',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          {item.type === 'wall' ? 'Wall' : 'Word'}
                        </span>
                      </td>

                      <td style={{ padding: '12px', verticalAlign: 'middle', lineHeight: '20px' }}>
                        {item.type === 'word' && item.word ? (
                          <span>
                            <strong>{item.word}</strong>: {item.text}
                          </span>
                        ) : (
                          item.text
                        )}
                      </td>

                      <td style={{ padding: '12px', color: 'var(--text-muted)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently'}
                      </td>

                      <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                          {item.type === 'wall' && (
                            <button
                              type="button"
                              title="Edit answer text"
                              onClick={() => {
                                setEditingItem(item);
                                setEditText(item.text);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                height: '32px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: 'var(--navy)',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={12} />
                              Edit
                            </button>
                          )}

                          {!isRemoved ? (
                            <button
                              type="button"
                              disabled={actionLoading[item.id]}
                              onClick={() => handleRemove(item)}
                              title="Hide from public and student walls"
                              style={{
                                height: '32px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoading[item.id]}
                              onClick={() => handleRestore(item)}
                              title="Restore to public and student walls"
                              style={{
                                height: '32px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                border: '1px solid #BBF7D0',
                                backgroundColor: '#F0FDF4',
                                color: '#166534',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Restore
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoading[item.id]}
                            onClick={() => handleDelete(item)}
                            title="Permanently delete from database"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#FFFFFF',
                              color: '#64748B',
                              cursor: 'pointer',
                              transition: 'all 120ms ease'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Moderation Cards List */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map((item) => {
              const isRemoved = item.status === 'removed';
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 6px rgba(24, 32, 58, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--navy)', display: 'block' }}>{item.authorName}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.authorCountry}</span>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '24px',
                        padding: '0 8px',
                        borderRadius: '999px',
                        backgroundColor: '#E4E9F4',
                        color: 'var(--navy)',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {item.type === 'wall' ? 'Wall' : 'Word'}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', lineHeight: '20px', color: 'var(--navy)' }}>
                    {item.type === 'word' && item.word ? (
                      <span>
                        <strong>{item.word}</strong>: {item.text}
                      </span>
                    ) : (
                      item.text
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F2F5', paddingTop: '10px' }}>
                    {item.type === 'wall' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setEditText(item.text);
                        }}
                        style={{
                          flex: 1,
                          minHeight: '44px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--navy)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                    )}

                    {!isRemoved ? (
                      <button
                        type="button"
                        disabled={actionLoading[item.id]}
                        onClick={() => handleRemove(item)}
                        style={{
                          flex: 1,
                          minHeight: '44px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #FCA5A5',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading[item.id]}
                        onClick={() => handleRestore(item)}
                        style={{
                          flex: 1,
                          minHeight: '44px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #BBF7D0',
                          backgroundColor: '#F0FDF4',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Restore
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionLoading[item.id]}
                      onClick={() => handleDelete(item)}
                      style={{
                        width: '44px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        color: '#64748B',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No posts found matching the selected filter.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', paddingTop: '8px' }}>
          <Info size={16} />
          <span>
            Edit modifies answer text across public and student walls. Remove hides the post while preserving history. Delete removes the answer and its upvotes permanently from the database.
          </span>
        </div>
      </section>

      {/* Edit Wall Answer Modal */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-dialog-title"
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingItem(null);
          }}
        >
          <div
            className="modal-sheet-dialog"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 id="edit-dialog-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>
                  Edit Wall Answer
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Submitted by <strong>{editingItem.authorName}</strong> ({editingItem.authorCountry})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  htmlFor="edit-answer-text"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}
                >
                  Answer text
                </label>
                <textarea
                  id="edit-answer-text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={5}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#18203A',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                  {editText.length} characters
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button
                  id="edit-modal-cancel-btn"
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={editSaving}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--navy)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  id="edit-modal-save-btn"
                  type="submit"
                  disabled={editSaving || !editText.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '38px',
                    padding: '0 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#1E7B4C',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: editSaving || !editText.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Check size={14} />
                  <span>{editSaving ? 'Saving...' : 'Save changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
