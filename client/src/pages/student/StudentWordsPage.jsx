import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export function StudentWordsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState('');
  const [language, setLanguage] = useState('');
  const [meaning, setMeaning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function fetchWords() {
      try {
        const res = await api.get('/me/words');
        setData(res);
      } catch (err) {
        console.error('Failed to load words:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
  }, []);

  const handleShareWord = async (e) => {
    e.preventDefault();
    if (!word.trim() || !language.trim() || !meaning.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/me/words', { word, language, meaning });
      if (res?.ok) {
        setData((prev) => ({
          ...prev,
          mySharedWords: [res.sharedWord, ...(prev.mySharedWords || [])]
        }));
        setWord('');
        setLanguage('');
        setMeaning('');
        toast.show('Word shared! Everyone can see it now.');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to share word', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWord = async (id) => {
    try {
      await api.delete(`/me/words/${id}`);
      setData((prev) => ({
        ...prev,
        mySharedWords: prev.mySharedWords.filter((w) => w.id !== id)
      }));
      toast.show('Word removed.');
    } catch (err) {
      toast.show(err.message || 'Failed to delete word', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="36px" width="220px" />
        <Skeleton height="240px" style={{ borderRadius: '20px' }} />
      </div>
    );
  }

  const wordOfMonth = data?.wordOfTheMonth;
  const phrases = data?.phrases || [];
  const myWords = data?.mySharedWords || [];
  const otherWords = data?.otherSharedWords || [];

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
          Learn a word
        </h1>
        <p style={{ margin: 0, fontSize: '17px', color: '#4A536B' }}>
          Learn a little Romanian, and teach everyone a word from your language.
        </p>
      </div>

      {/* Word of the Month Card */}
      {wordOfMonth && (
        <section
          style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'stretch',
            padding: '36px',
            borderRadius: '24px',
            backgroundColor: '#FDF3D3',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#5C4A00' }}>
              Word of the month, {wordOfMonth.month}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(56px, 6vw, 96px)',
                lineHeight: 1,
                letterSpacing: '-2px',
                color: '#18203A'
              }}
            >
              {wordOfMonth.word}
            </span>
            <span style={{ fontSize: '16px', color: '#4A536B' }}>
              {wordOfMonth.pronunciation}
            </span>
            <p style={{ margin: '6px 0 0', fontSize: '18px', lineHeight: '27px', color: '#18203A' }}>
              {wordOfMonth.meaning}
            </p>
          </div>

          <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#4A536B' }}>
                Use it in a sentence
              </span>
              <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px', color: '#18203A', margin: '4px 0' }}>
                {wordOfMonth.exampleRo}
              </span>
              <span style={{ fontSize: '15px', color: '#4A536B' }}>
                {wordOfMonth.exampleEn}
              </span>
            </div>

            {wordOfMonth.challenge && (
              <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#18203A', color: '#FFFFFF' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#F2B705' }}>
                  This month's challenge
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '15px', lineHeight: '22px', color: '#E4E9F4' }}>
                  {wordOfMonth.challenge}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2-Column: Share a Word Form & Words You Shared */}
      <div className="student-words-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Share Form */}
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
            Teach us a word
          </h2>
          <span style={{ fontSize: '14px', color: '#4A536B' }}>
            Share a word from your language that doesn't have an exact English translation.
          </span>

          <form onSubmit={handleShareWord} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <input
                type="text"
                placeholder="Word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                style={{ height: '42px', padding: '0 12px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '14px' }}
              />
              <input
                type="text"
                placeholder="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ height: '42px', padding: '0 12px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
            <input
              type="text"
              placeholder="What it means"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              style={{ height: '42px', padding: '0 12px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '14px' }}
            />
            <button
              type="submit"
              disabled={submitting || !word.trim()}
              style={{
                alignSelf: 'flex-start',
                height: '42px',
                padding: '0 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#B42318',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Share word
            </button>
          </form>
        </section>

        {/* Words you shared */}
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
            Words you shared
          </h2>

          {myWords.length === 0 ? (
            <span style={{ fontSize: '14px', color: '#4A536B' }}>
              You haven't shared any words yet. Teach us something from your mother tongue!
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myWords.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F2F3F6'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: '#18203A' }}>{w.word}</span>
                      <span style={{ fontSize: '13px', color: '#4A536B' }}>({w.language})</span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#4A536B' }}>{w.meaning}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteWord(w.id)}
                    style={{
                      padding: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#B42318',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Phrases Section */}
      {phrases.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '24px',
              color: '#18203A'
            }}
          >
            Everyday Romanian to start with
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {phrases.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9DDE6'
                }}
              >
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', color: '#18203A' }}>
                  {p.romanian}
                </span>
                <span style={{ fontSize: '13px', color: '#4A536B' }}>{p.pronunciation}</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#18203A', marginTop: '2px' }}>
                  {p.english}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Words from Other Members */}
      {otherWords.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '24px',
              color: '#18203A'
            }}
          >
            Words from other members
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {otherWords.map((w) => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9DDE6'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#E4E9F4', fontSize: '12px', fontWeight: 700 }}>
                    {w.language}
                  </span>
                  <span style={{ fontSize: '13px', color: '#4A536B' }}>From {w.sharedBy}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', color: '#18203A' }}>
                  {w.word}
                </span>
                <span style={{ fontSize: '14px', lineHeight: '20px', color: '#4A536B' }}>
                  {w.meaning}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 900px) {
          .student-words-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
