import React, { useState, useEffect } from 'react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export function StudentQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('events');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await api.get('/me/questions');
        setQuestions(res?.questions || []);
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/me/questions', { topic, text });
      if (res?.ok) {
        setQuestions((prev) => [res.question, ...prev]);
        setText('');
        setSentMessage(true);
        toast.show('Question submitted to coordinator.');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to submit question', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

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
          Ask the coordinator
        </h1>
        <p style={{ margin: 0, fontSize: '17px', color: '#4A536B' }}>
          Ask a question, and find every answer here.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Column: Form */}
        <section
          className="student-ask-card"
          style={{
            width: '420px',
            flexShrink: 0,
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
              fontSize: '20px',
              lineHeight: '26px',
              color: '#18203A'
            }}
          >
            Ask a question
          </h2>
          <span style={{ fontSize: '14px', lineHeight: '20px', color: '#4A536B' }}>
            Anything at all: activities, life in Craiova, your stay. The answer appears under My questions.
          </span>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              aria-label="Topic"
              style={{
                height: '44px',
                padding: '0 14px',
                border: '1.5px solid #C3C9D6',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                fontSize: '15px',
                color: '#18203A'
              }}
            >
              <option value="events">Events and activities</option>
              <option value="life_in_craiova">Life in Craiova</option>
              <option value="other">Something else</option>
            </select>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Type your question"
              style={{
                minHeight: '110px',
                padding: '12px 14px',
                border: '1.5px solid #C3C9D6',
                borderRadius: '10px',
                fontSize: '15px',
                lineHeight: '22px',
                color: '#18203A',
                resize: 'none'
              }}
            />

            <button
              type="submit"
              disabled={submitting || !text.trim()}
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
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
              Send question
            </button>
          </form>

          {sentMessage && (
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#17633D' }}>
              Sent. It's now at the top of My questions.
            </span>
          )}
        </section>

        {/* Right Column: Questions List */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            My questions
          </h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton height="100px" style={{ borderRadius: '18px' }} />
              <Skeleton height="140px" style={{ borderRadius: '18px' }} />
            </div>
          ) : questions.length === 0 ? (
            <div
              style={{
                padding: '36px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #D9DDE6',
                textAlign: 'center',
                color: '#4A536B'
              }}
            >
              You haven't asked any questions yet. Use the form on the left to ask anything!
            </div>
          ) : (
            questions.map((q) => {
              const isAnswered = q.status === 'answered';
              return (
                <article
                  key={q.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9DDE6',
                    borderRadius: '20px',
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '17px', lineHeight: '24px', color: '#18203A' }}>
                        {q.text}
                      </span>
                      <span style={{ fontSize: '13px', color: '#4A536B' }}>
                        {formatDate(q.createdAt)}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '26px',
                        padding: '0 10px',
                        borderRadius: '999px',
                        backgroundColor: isAnswered ? '#E8F5EE' : '#FDF3D3',
                        color: isAnswered ? '#17633D' : '#5C4A00',
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {isAnswered ? 'Answered' : 'Waiting'}
                    </span>
                  </div>

                  {isAnswered && q.answer ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#F2F3F6',
                        borderLeft: '4px solid #1E7B4C'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#17633D' }}>
                        Answer
                      </span>
                      <span style={{ fontSize: '15px', lineHeight: '22px', color: '#18203A' }}>
                        {q.answer}
                      </span>
                      <span style={{ fontSize: '12px', color: '#4A536B' }}>
                        International Relations Team{q.answeredAt ? `, ${formatDate(q.answeredAt)}` : ''}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#4A536B' }}>
                      The International Relations team will answer soon. You'll get a notification.
                    </span>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .student-ask-card {
            width: 100% !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
