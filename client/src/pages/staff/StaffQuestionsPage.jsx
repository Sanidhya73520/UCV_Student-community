import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
  Edit2,
  HelpCircle,
  User
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';

export function StaffQuestionsPage() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('selected');
  const { showToast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState('new'); // 'new' | 'answered'
  const [search, setSearch] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/staff/questions');
      const list = res.questions || [];
      setQuestions(list);

      // Select question
      if (preselectedId) {
        const found = list.find((q) => q.id === preselectedId);
        if (found) {
          setSelectedQuestion(found);
          setTab(found.status === 'answered' ? 'answered' : 'new');
          setAnswerText(found.answer?.text || '');
          return;
        }
      }

      // Default selection based on current tab
      const currentList = list.filter((q) => (tab === 'new' ? q.status === 'waiting' : q.status === 'answered'));
      if (currentList.length > 0) {
        setSelectedQuestion(currentList[0]);
        setAnswerText(currentList[0].answer?.text || '');
      } else {
        setSelectedQuestion(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSelect = (q) => {
    setSelectedQuestion(q);
    setAnswerText(q.answer?.text || '');
    setIsEditing(false);
  };

  const handlePublishAnswer = async (e) => {
    e.preventDefault();
    if (!selectedQuestion || !answerText.trim()) return;

    try {
      setSubmitting(true);
      const isAlreadyAnswered = selectedQuestion.status === 'answered';
      if (isAlreadyAnswered) {
        await api.put(`/staff/questions/${selectedQuestion.id}/answer`, { answer: answerText.trim() });
        showToast({ message: 'Answer updated.', type: 'success' });
      } else {
        await api.post(`/staff/questions/${selectedQuestion.id}/answer`, { answer: answerText.trim() });
        showToast({ message: 'Answer published and sent to student.', type: 'success' });
      }

      setIsEditing(false);
      await fetchQuestions();
    } catch (err) {
      showToast({ message: err.message || 'Failed to submit answer.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const newQuestionsCount = questions.filter((q) => q.status === 'waiting').length;

  const filteredQuestions = questions.filter((q) => {
    const matchesTab = tab === 'new' ? q.status === 'waiting' : q.status === 'answered';
    if (!matchesTab) return false;
    if (!search.trim()) return true;

    const term = search.toLowerCase();
    return (
      (q.text || '').toLowerCase().includes(term) ||
      (q.studentName || '').toLowerCase().includes(term) ||
      (q.countryName || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800 }}>
            Questions
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
            From Ask the coordinator. Your answer appears under the student's My questions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div role="tablist" aria-label="Filter questions" style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'new'}
            onClick={() => {
              setTab('new');
              const firstNew = questions.find((q) => q.status === 'waiting');
              setSelectedQuestion(firstNew || null);
              setAnswerText(firstNew?.answer?.text || '');
              setIsEditing(false);
            }}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '999px',
              border: tab === 'new' ? '1.5px solid var(--navy)' : '1.5px solid var(--border)',
              backgroundColor: tab === 'new' ? 'var(--navy)' : 'var(--white)',
              color: tab === 'new' ? 'var(--white)' : 'var(--navy)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            New ({newQuestionsCount})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'answered'}
            onClick={() => {
              setTab('answered');
              const firstAnswered = questions.find((q) => q.status === 'answered');
              setSelectedQuestion(firstAnswered || null);
              setAnswerText(firstAnswered?.answer?.text || '');
              setIsEditing(false);
            }}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '999px',
              border: tab === 'answered' ? '1.5px solid var(--navy)' : '1.5px solid var(--border)',
              backgroundColor: tab === 'answered' ? 'var(--navy)' : 'var(--white)',
              color: tab === 'answered' ? 'var(--white)' : 'var(--navy)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Answered
          </button>
        </div>
      </header>

      {error && <ErrorAlert message={error} onRetry={fetchQuestions} />}

      {/* Main Container: Inbox list + Reply viewer */}
      <div className="staff-questions-grid">
        {/* Left Column: Questions Inbox */}
        <section
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
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
              aria-label="Search questions"
              placeholder="Search questions or students"
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

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0' }}>
              <Skeleton height="70px" />
              <Skeleton height="70px" />
              <Skeleton height="70px" />
            </div>
          ) : filteredQuestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '600px', overflowY: 'auto' }}>
              {filteredQuestions.map((q) => {
                const isSelected = selectedQuestion?.id === q.id;
                const isNew = q.status === 'waiting';

                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelect(q)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#E4E9F4' : 'transparent',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'background-color 150ms'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '15px',
                          color: 'var(--navy)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {q.text}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '22px',
                          padding: '0 8px',
                          borderRadius: '999px',
                          backgroundColor: isNew ? '#FBEAE8' : '#E8F5EE',
                          color: isNew ? '#8F1B12' : '#17633D',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {isNew ? 'New' : 'Answered'}
                      </span>
                    </div>

                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--navy)' }}>{q.studentName || q.student?.fullName || 'International Student'}</strong>, {q.countryName || q.countryCode || q.student?.countryName || 'Craiova'},{' '}
                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : 'Recently'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No {tab === 'new' ? 'new' : 'answered'} questions found.
            </div>
          )}
        </section>

        {/* Right Column: Selected Question & Answer Composer */}
        <section
          style={{
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {selectedQuestion ? (
            <>
              {/* Question metadata header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Question from <strong style={{ color: 'var(--navy)' }}>{selectedQuestion.studentName || selectedQuestion.student?.fullName || 'International Student'}</strong>,{' '}
                    {selectedQuestion.countryName || selectedQuestion.countryCode || selectedQuestion.student?.countryName || 'International'},{' '}
                    {selectedQuestion.faculty ? `Faculty of ${selectedQuestion.faculty}, ` : ''}
                    {selectedQuestion.createdAt ? new Date(selectedQuestion.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </span>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800 }}>
                    {selectedQuestion.text}
                  </h2>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: '28px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    backgroundColor: selectedQuestion.status === 'waiting' ? '#FBEAE8' : '#E8F5EE',
                    color: selectedQuestion.status === 'waiting' ? '#8F1B12' : '#17633D',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0
                  }}
                >
                  {selectedQuestion.status === 'waiting' ? 'New' : 'Answered'}
                </span>
              </div>

              {/* Category pill if available */}
              {selectedQuestion.category && (
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: '#E4E9F4',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--navy)'
                    }}
                  >
                    Category:{' '}
                    {selectedQuestion.category === 'activities'
                      ? 'Events and activities'
                      : selectedQuestion.category === 'life'
                      ? 'Life in Craiova'
                      : selectedQuestion.category === 'profile_change'
                      ? 'Profile change request'
                      : 'General'}
                  </span>
                </div>
              )}

              {/* Question text card */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--paper)',
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: 'var(--navy)'
                }}
              >
                {selectedQuestion.text}
              </div>

              {/* Answer area */}
              {selectedQuestion.status === 'waiting' || isEditing ? (
                <form onSubmit={handlePublishAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label htmlFor="coordinator-answer" style={{ fontSize: '15px', fontWeight: 700 }}>
                    Your answer
                  </label>
                  <textarea
                    id="coordinator-answer"
                    rows={5}
                    required
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={`Write the answer ${selectedQuestion.studentFirstName || 'the student'} will see`}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border)',
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      lineHeight: '22px',
                      color: 'var(--navy)',
                      resize: 'vertical'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {selectedQuestion.studentFirstName || 'The student'} receives a notification and email, and the answer appears under their question.
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isEditing && (
                        <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" loading={submitting}>
                        <Send size={16} />
                        {isEditing ? 'Save answer' : 'Publish answer'}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Answered state */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--paper)',
                    borderLeft: '4px solid var(--forest)'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--forest)' }}>
                    Answer sent{' '}
                    {selectedQuestion.answer?.answeredAt
                      ? new Date(selectedQuestion.answer.answeredAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                      : ''}
                  </span>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: '22px', color: 'var(--navy)', whiteSpace: 'pre-wrap' }}>
                    {selectedQuestion.answer?.text}
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '8px',
                      height: '36px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--white)',
                      color: 'var(--navy)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit2 size={14} />
                    Edit answer
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <HelpCircle size={48} strokeWidth={1.5} style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>
                Select a question
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: '14px' }}>
                Pick a question from the inbox on the left to read and reply.
              </p>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .staff-questions-grid {
          display: grid;
          grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .staff-questions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
