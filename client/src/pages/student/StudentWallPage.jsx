import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Calendar, MessageSquare, MapPin, Send, CheckCircle2, Clock, Sparkles, Edit2 } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Button } from '../../components/Button.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatWallDate } from '../../lib/dateUtils.js';
import { useWallSync, broadcastWallUpdate } from '../../lib/wallSync.js';

export function StudentWallPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [meTooIds, setMeTooIds] = useState(new Set());
  const [wallUpvoteColor, setWallUpvoteColor] = useState('#1E7B4C');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const toast = useToast();

  const fetchWall = async () => {
    try {
      const [wallRes, votesRes] = await Promise.all([
        api.get('/me/wall'),
        api.get('/public/votes/mine').catch(() => ({ meTooPostIds: [] }))
      ]);
      setData(wallRes);
      if (wallRes?.wallUpvoteColor) {
        setWallUpvoteColor(wallRes.wallUpvoteColor);
      }
      setMeTooIds(new Set(votesRes?.meTooPostIds || []));
    } catch (err) {
      console.error('Failed to load student wall:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWall();
  }, []);

  useWallSync({
    onUpdate: (evt) => {
      if (evt?.wallUpvoteColor) {
        setWallUpvoteColor(evt.wallUpvoteColor);
      }
      if (evt?.action === 'meToo' && evt?.postId) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            visiblePosts: prev.visiblePosts.map((p) =>
              p.id === evt.postId ? { ...p, meTooCount: evt.meTooCount } : p
            )
          };
        });
      } else {
        fetchWall();
      }
    },
    onRefresh: fetchWall
  });

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      let res;
      if (isEditing && data?.myPost?.id) {
        res = await api.put(`/me/wall/posts/${data.myPost.id}`, { text });
      } else {
        res = await api.post('/me/wall/posts', { text });
      }
      if (res?.ok) {
        setText('');
        setIsEditing(false);
        toast.show(res?.updated || isEditing ? 'Answer updated!' : 'Answer posted! Thank you for sharing your thoughts.');
        broadcastWallUpdate({ action: isEditing ? 'update' : 'create' });
        await fetchWall();
      }
    } catch (err) {
      toast.show(err.message || 'Failed to post on the wall', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteMyPost = async () => {
    if (!data?.myPost?.id) return;
    setDeletingPost(true);
    try {
      const postId = data.myPost.id;
      await api.delete(`/me/wall/posts/${postId}`);
      setDeleteConfirmOpen(false);
      setData((prev) => (prev ? {
        ...prev,
        myPost: null,
        visiblePosts: (prev.visiblePosts || []).filter((p) => p.id !== postId)
      } : prev));
      setText('');
      setIsEditing(false);
      toast.show('Your answer has been deleted.');
      broadcastWallUpdate({ action: 'delete', postId });
      await fetchWall();
    } catch (err) {
      toast.show(err.message || 'Failed to delete answer', 'error');
    } finally {
      setDeletingPost(false);
    }
  };

  const handleToggleMeToo = async (postId) => {
    try {
      const res = await api.post('/public/me-too/toggle', { wallPostId: postId });
      if (res) {
        setMeTooIds((prev) => {
          const next = new Set(prev);
          if (res.hasMeToo) next.add(postId);
          else next.delete(postId);
          return next;
        });

        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            visiblePosts: prev.visiblePosts.map((p) =>
              p.id === postId ? { ...p, meTooCount: res.meTooCount } : p
            )
          };
        });

        broadcastWallUpdate({ action: 'meToo', postId, meTooCount: res.meTooCount });
      }
    } catch (err) {
      console.error('Me too failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px 40px' }}>
        <Skeleton height="36px" width="260px" />
        <Skeleton height="320px" style={{ borderRadius: '20px' }} />
      </div>
    );
  }

  const currentQ = data?.currentQuestion;
  const myPost = data?.myPost;
  const visiblePosts = data?.visiblePosts || [];

  return (
    <div className="student-wall-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '999px',
            backgroundColor: '#FBEAE8',
            border: '1px solid rgba(180, 35, 24, 0.2)',
            alignSelf: 'flex-start'
          }}
        >
          <MessageSquare size={13} color="var(--red)" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            STUDENT COMMUNITY PROMPT
          </span>
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '32px',
            lineHeight: '38px',
            letterSpacing: '-0.5px',
            color: 'var(--navy)'
          }}
        >
          International Wall
        </h1>
        <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-muted)' }}>
          Answer the monthly community question, share your perspective, and see how peers from around the world respond.
        </p>
      </div>

      <div className="student-wall-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1.85fr)', gap: '28px', alignItems: 'start' }}>
        {/* Left Column: Active Question & Answer Submission Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Question Showcase Card */}
          <section
            className="student-wall-card"
            style={{
              backgroundColor: '#18203A',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 24px -4px rgba(24, 32, 58, 0.12)'
            }}
          >
            {currentQ ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Published Date in DD Month YYYY format */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(242, 183, 5, 0.18)',
                      border: '1px solid rgba(242, 183, 5, 0.35)',
                      color: '#F2B705',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    <Calendar size={13} />
                    <span>
                      {currentQ.createdAt
                        ? `Published on ${formatWallDate(currentQ.createdAt)}`
                        : 'Active prompt'}
                    </span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(74, 222, 128, 0.15)',
                      color: '#4ADE80',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
                    Accepting answers
                  </span>
                </div>

                <h2
                  style={{
                    margin: '4px 0 0',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '22px',
                    lineHeight: '28px',
                    color: '#FFFFFF'
                  }}
                >
                  {currentQ.question}
                </h2>
              </>
            ) : (
              <span style={{ fontSize: '15px', color: '#CBD5E1' }}>
                No community question is active at this time.
              </span>
            )}
          </section>

          {/* Submission Area Card */}
          <section
            className="student-wall-card"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #E2E6EE',
              boxShadow: '0 2px 10px rgba(24, 32, 58, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {myPost && !isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color={myPost.state === 'visible' ? '#1E7B4C' : myPost.state === 'removed' ? '#DC2626' : '#D97706'} />
                    <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>Your submitted answer</strong>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: myPost.state === 'visible' ? '#E8F5EE' : myPost.state === 'removed' ? '#FEE2E2' : '#FEF3D6',
                      color: myPost.state === 'visible' ? '#17633D' : myPost.state === 'removed' ? '#991B1B' : '#92400E',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: myPost.state === 'visible' ? '1px solid #BBF7D0' : myPost.state === 'removed' ? '1px solid #FCA5A5' : '1px solid #FDE68A',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {myPost.state === 'visible' ? 'Live on the wall' : myPost.state === 'removed' ? 'Removed after review' : 'Under staff review'}
                  </span>
                </div>

                {myPost.state === 'removed' && (
                  <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', fontSize: '13px', color: '#991B1B' }}>
                    This answer was removed during staff review. You can edit your response below or delete it to submit a new answer.
                  </div>
                )}

                {myPost.createdAt && (
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Submitted on {formatWallDate(myPost.createdAt)}
                  </span>
                )}

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: '22px', color: '#1E293B' }}>
                    "{myPost.text}"
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    id="edit-my-answer-btn"
                    onClick={() => {
                      setText(myPost.text);
                      setIsEditing(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--navy)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={13} />
                    Edit answer
                  </button>

                  <button
                    type="button"
                    id="delete-my-answer-btn"
                    onClick={() => setDeleteConfirmOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                    Delete my answer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <label
                      htmlFor="wall-answer-input"
                      style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}
                    >
                      {isEditing ? 'Edit your answer' : 'Add your answer'}
                    </label>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {isEditing ? 'Update your response for this month’s question.' : 'Share your experience in a sentence or two. Every answer is read by staff before publishing.'}
                    </span>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setText('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <textarea
                  id="wall-answer-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Nicolae Romanescu Park is peaceful and has stunning walking trails..."
                  style={{
                    padding: '12px 14px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    fontSize: '15px',
                    lineHeight: '22px',
                    color: '#18203A',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />

                <div className="wall-form-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {text.length} characters
                  </span>

                  <div className="wall-form-btn-group" style={{ display: 'flex', gap: '8px' }}>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setText('');
                        }}
                        style={{
                          height: '42px',
                          padding: '0 16px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--navy)',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      id="post-wall-answer-btn"
                      disabled={submitting || !text.trim()}
                      className="wall-submit-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        height: '42px',
                        padding: '0 20px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: text.trim() ? (wallUpvoteColor || '#1E7B4C') : '#CBD5E1',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: text.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 160ms ease'
                      }}
                    >
                      <Send size={15} style={{ flexShrink: 0 }} />
                      <span>{submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Post to International Wall'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Right Column: Community Answers */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '22px',
                lineHeight: '28px',
                color: 'var(--navy)'
              }}
            >
              What our members said
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: '28px',
                padding: '0 12px',
                borderRadius: '999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9DDE6',
                color: 'var(--navy)',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {visiblePosts.length} answers
            </span>
          </div>

          {visiblePosts.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1.5px dashed #CBD5E1',
                textAlign: 'center',
                color: '#64748B'
              }}
            >
              <MessageSquare size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>No community answers visible yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Be the first to share your perspective on the left!</p>
            </div>
          ) : (
            <div className="student-wall-answers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
              {visiblePosts.map((p) => {
                const isMeToo = meTooIds.has(p.id);
                return (
                  <article
                    key={p.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E6EE',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: '0 2px 8px rgba(24, 32, 58, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: '#E4E9F4',
                              color: 'var(--navy)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '15px'
                            }}
                          >
                            {p.user?.firstName?.charAt(0) || '?'}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)' }}>
                              {p.user?.firstName || 'Student'}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B' }}>
                              <MapPin size={11} color="#94A3B8" />
                              {p.user?.countryName || 'International Student'}
                            </span>
                          </div>
                        </div>

                        {p.createdAt && (
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                            {formatWallDate(p.createdAt)}
                          </span>
                        )}
                      </div>

                      <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                        <p style={{ margin: 0, fontSize: '15px', lineHeight: '21px', color: '#1E293B' }}>
                          "{p.text}"
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F4F9', paddingTop: '10px' }}>
                      <button
                        type="button"
                        aria-pressed={isMeToo}
                        onClick={() => handleToggleMeToo(p.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '34px',
                          padding: '0 14px',
                          borderRadius: '999px',
                          border: isMeToo ? `1.5px solid ${wallUpvoteColor || '#1E7B4C'}` : '1.5px solid #CBD5E1',
                          backgroundColor: isMeToo ? '#E8F5EE' : '#FFFFFF',
                          color: isMeToo ? '#17633D' : 'var(--navy)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        <Heart
                          size={14}
                          fill={isMeToo ? (wallUpvoteColor || '#1E7B4C') : 'none'}
                          color={isMeToo ? (wallUpvoteColor || '#1E7B4C') : 'currentColor'}
                        />
                        <span>Me too {p.meTooCount ? `(${p.meTooCount})` : ''}</span>
                      </button>

                      <span style={{ fontSize: '11px', color: isMeToo ? '#17633D' : '#94A3B8', fontWeight: isMeToo ? 700 : 500 }}>
                        {isMeToo ? '✓ Agreed' : ''}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete your answer?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: '22px', color: '#4A536B' }}>
            Are you sure you want to delete your submitted answer from the International Wall? You will be able to rewrite and post a new answer right away.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              id="cancel-delete-answer-btn"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deletingPost}
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: 'var(--navy)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-delete-answer-btn"
              onClick={confirmDeleteMyPost}
              disabled={deletingPost}
              style={{
                height: '40px',
                padding: '0 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: deletingPost ? 'not-allowed' : 'pointer'
              }}
            >
              {deletingPost ? 'Deleting...' : 'Delete answer'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .student-wall-container {
          padding: 32px 40px;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }

        .student-wall-grid {
          width: 100%;
          min-width: 0;
        }

        .student-wall-grid > * {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 900px) {
          .student-wall-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .student-wall-answers-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .student-wall-container {
            padding: 8px 0 !important;
            gap: 20px !important;
          }
          .student-wall-card {
            padding: 18px 14px !important;
            border-radius: 16px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .student-wall-answers-grid article {
            padding: 16px 14px !important;
            border-radius: 14px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
        }

        @media (max-width: 600px) {
          .wall-form-action-row {
            flex-direction: column-reverse !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .wall-form-btn-group {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .wall-submit-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 0 16px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
