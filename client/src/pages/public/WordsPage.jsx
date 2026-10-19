import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

function normalizeLanguage(lang = '') {
  const l = lang.trim().toLowerCase();
  if (l === 'eng' || l === 'en') return 'English';
  if (l === 'es' || l === 'spanish') return 'Spanish';
  if (l === 'tr' || l === 'turkish') return 'Turkish';
  if (l === 'fr' || l === 'french') return 'French';
  if (l === 'hi' || l === 'hindi') return 'Hindi';
  if (l === 'ro' || l === 'romanian') return 'Romanian';
  if (l === 'de' || l === 'german') return 'German';
  if (l === 'it' || l === 'italian') return 'Italian';
  if (l === 'ar' || l === 'arabic') return 'Arabic';
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

export function WordsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [playingWord, setPlayingWord] = useState(null);
  const { isStudent } = useAuth();

  useEffect(() => {
    async function fetchWords() {
      try {
        const res = await api.get('/public/words');
        setData(res);
      } catch (err) {
        console.error('Failed to load words:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
  }, []);

  const wordOfTheMonth = data?.wordOfTheMonth || {
    word: 'dor',
    month: 'October',
    pronunciation: 'Say it like "door", with a rolled r',
    meaning: 'A deep longing for someone or something you love, often home. Romanians say it has no exact translation.',
    exampleRo: 'Mi-e dor de casă.',
    exampleEn: 'I miss home.',
    challenge: 'Use "dor" once this week with a Romanian friend, and see if they notice.'
  };

  const phrases = useMemo(() => {
    const raw = data?.phrases || [];
    const defaultPhrases = [
      { id: 'p1', romanian: 'Bună', pronunciation: 'BOO-nuh', english: 'Hi' },
      { id: 'p2', romanian: 'Mulțumesc', pronunciation: 'mool-tsoo-MESK', english: 'Thank you' },
      { id: 'p3', romanian: 'Noroc', pronunciation: 'no-ROK', english: 'Cheers / Good luck' },
      { id: 'p4', romanian: 'Poftă bună', pronunciation: 'POF-tuh BOO-nuh', english: 'Enjoy your meal' },
      { id: 'p5', romanian: 'Pe curând', pronunciation: 'peh koo-RUHND', english: 'See you soon' },
      { id: 'p6', romanian: 'Nu înțeleg', pronunciation: 'noo uhn-tseh-LEG', english: "I don't understand" }
    ];

    if (!raw.length) return defaultPhrases;

    const seen = new Set();
    const result = [];
    for (const p of raw) {
      const key = p.romanian.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    }
    for (const dp of defaultPhrases) {
      const key = dp.romanian.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(dp);
      }
    }
    return result.slice(0, 6);
  }, [data]);

  const allSharedWords = useMemo(() => {
    const raw = data?.sharedWords || [];
    const mockupWords = [
      {
        id: 'mock-1',
        word: 'Retrouvailles',
        language: 'French',
        meaning: 'Some reunions feel like finding a piece of yourself again.',
        sharedBy: '',
        countryName: ''
      },
      {
        id: 'mock-2',
        word: 'Namaste',
        language: 'Hindi',
        meaning: 'Every new friendship begins with a simple hello.',
        sharedBy: '',
        countryName: ''
      },
      {
        id: 'mock-3',
        word: 'Kolay gelsin',
        language: 'Turkish',
        meaning: 'May the work ahead feel a little lighter.',
        sharedBy: '',
        countryName: ''
      },
      {
        id: 'mock-4',
        word: 'Sobremesa',
        language: 'Spanish',
        meaning: 'The best conversations begin when the meal ends.',
        sharedBy: '',
        countryName: ''
      }
    ];

    const seenWords = new Set();
    const list = [];

    for (const w of raw) {
      const normalizedLang = normalizeLanguage(w.language);
      const key = w.word.trim().toLowerCase();
      if (!seenWords.has(key)) {
        seenWords.add(key);
        list.push({
          ...w,
          language: normalizedLang
        });
      }
    }

    for (const mw of mockupWords) {
      const key = mw.word.trim().toLowerCase();
      if (!seenWords.has(key)) {
        seenWords.add(key);
        list.push(mw);
      }
    }

    return list;
  }, [data]);

  const availableLanguages = useMemo(() => {
    const set = new Set();
    allSharedWords.forEach((w) => {
      if (w.language) set.add(w.language);
    });
    const priority = ['Spanish', 'Turkish', 'French', 'Hindi'];
    const remaining = Array.from(set).filter((l) => !priority.includes(l)).sort();
    const ordered = [...priority.filter((p) => set.has(p)), ...remaining];
    return ['All', ...ordered];
  }, [allSharedWords]);

  const filteredWords = useMemo(() => {
    if (selectedLanguage === 'All') return allSharedWords;
    return allSharedWords.filter((w) => w.language.toLowerCase() === selectedLanguage.toLowerCase());
  }, [allSharedWords, selectedLanguage]);

  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlayingWord(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ro-RO';
    utterance.rate = 0.9;
    utterance.onend = () => setPlayingWord(null);
    utterance.onerror = () => setPlayingWord(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      style={{
        backgroundColor: '#F2F3F6',
        minHeight: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#18203A'
      }}
    >
      <main
        className="words-page-main"
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          padding: '36px 56px 48px',
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Page Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
              fontWeight: 800,
              fontSize: '40px',
              lineHeight: '46px',
              letterSpacing: '-0.5px',
              color: '#18203A'
            }}
          >
            Learn a word
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '17px',
              lineHeight: '26px',
              color: '#4A536B'
            }}
          >
            A Romanian word every month, and words our members teach each other.
          </p>
        </div>

        {/* 2-Column Responsive Layout matching mockup */}
        <div
          className="learn-word-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0px, 1fr) 440px',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Word of the Month + Everyday Romanian */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            {/* Word of the Month Section */}
            {loading ? (
              <Skeleton height="320px" style={{ borderRadius: '24px' }} />
            ) : (
              <section
                aria-label="Word of the month"
                className="word-month-section"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '22px',
                  padding: '30px 32px',
                  borderRadius: '24px',
                  background: '#FDF3D3',
                  border: '1px solid rgba(224, 162, 0, 0.28)',
                  boxShadow: '0 8px 24px -4px rgba(92, 74, 0, 0.06)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  className="word-month-flex"
                  style={{
                    display: 'flex',
                    gap: '28px',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                  }}
                >
                  <div className="word-month-info" style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#5C4A00'
                      }}
                    >
                      Word of the month · {wordOfTheMonth.month || 'October'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
                      <span
                        style={{
                          fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                          fontWeight: 800,
                          fontSize: 'clamp(56px, 6vw, 76px)',
                          lineHeight: '80px',
                          letterSpacing: '-2px',
                          color: '#18203A'
                        }}
                      >
                        {wordOfTheMonth.word}
                      </span>
                      {wordOfTheMonth.word && (
                        <button
                          type="button"
                          onClick={() => handleSpeak(wordOfTheMonth.word)}
                          title="Listen to pronunciation"
                          aria-label={`Listen to ${wordOfTheMonth.word}`}
                          style={{
                            background: playingWord === wordOfTheMonth.word ? '#18203A' : 'rgba(24, 32, 58, 0.08)',
                            color: playingWord === wordOfTheMonth.word ? '#FFFFFF' : '#18203A',
                            border: 'none',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <span
                      style={{
                        alignSelf: 'flex-start',
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '28px',
                        padding: '0px 12px',
                        borderRadius: '999px',
                        background: 'rgba(24, 32, 58, 0.08)',
                        fontSize: '14px',
                        color: '#2E3650'
                      }}
                    >
                      {wordOfTheMonth.pronunciation || 'Say it like "door", with a rolled r'}
                    </span>

                    <p
                      style={{
                        margin: '6px 0px 0px',
                        fontSize: '17px',
                        lineHeight: '26px',
                        color: '#18203A'
                      }}
                    >
                      {wordOfTheMonth.meaning}
                    </p>
                  </div>

                  {/* Use it in a sentence box */}
                  <div
                    className="word-sentence-box"
                    style={{
                      width: '300px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '20px 22px',
                      borderRadius: '18px',
                      background: '#FFFFFF',
                      border: '1px solid rgba(224, 162, 0, 0.22)',
                      boxShadow: '0 4px 16px rgba(24, 32, 58, 0.04)'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#4A536B' }}>
                      Use it in a sentence
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                          fontWeight: 700,
                          fontSize: '22px',
                          lineHeight: '28px',
                          color: '#18203A'
                        }}
                      >
                        {wordOfTheMonth.exampleRo || 'Mi-e dor de casă.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(wordOfTheMonth.exampleRo || 'Mi-e dor de casă.')}
                        title="Listen to sentence"
                        aria-label="Listen to example sentence"
                        style={{
                          background: 'transparent',
                          color: '#7A849C',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      </button>
                    </div>
                    <span style={{ fontSize: '15px', color: '#4A536B' }}>
                      {wordOfTheMonth.exampleEn || 'I miss home.'}
                    </span>
                  </div>
                </div>

                {/* This month's challenge ribbon */}
                <div
                  className="word-challenge-box"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: '#18203A',
                    color: '#FFFFFF'
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#F2B705'
                    }}
                  >
                    This month's challenge
                  </span>
                  <span style={{ fontSize: '15px', lineHeight: '22px', color: '#FFFFFF' }}>
                    {wordOfTheMonth.challenge || 'Use "dor" once this week with a Romanian friend, and see if they notice.'}
                  </span>
                </div>
              </section>
            )}

            {/* Everyday Romanian to start with Section */}
            <section
              aria-label="Everyday Romanian"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '24px',
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid #D9DDE6',
                boxShadow: '0 4px 16px rgba(24, 32, 58, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                    fontWeight: 800,
                    fontSize: '22px',
                    lineHeight: '28px',
                    color: '#18203A'
                  }}
                >
                  Everyday Romanian to start with
                </h2>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#6B7389'
                  }}
                >
                  {phrases.length} phrases
                </span>
              </div>

              <div
                className="everyday-phrases-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0px, 1fr))',
                  gap: '12px'
                }}
              >
                {phrases.map((p) => (
                  <div
                    key={p.id || p.romanian}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: '#F2F3F6',
                      border: '1px solid #E4E9F4',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(24, 32, 58, 0.06)';
                      e.currentTarget.style.borderColor = '#D9DDE6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#E4E9F4';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                          fontWeight: 700,
                          fontSize: '20px',
                          lineHeight: '26px',
                          color: '#18203A'
                        }}
                      >
                        {p.romanian}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(p.romanian)}
                        title="Listen"
                        aria-label={`Listen to ${p.romanian}`}
                        style={{
                          background: 'transparent',
                          color: '#7A849C',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      </button>
                    </div>
                    <span style={{ fontSize: '13px', color: '#4A536B' }}>{p.pronunciation}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#2E3650' }}>
                      {p.english}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column / Sidebar: Words from our members */}
          <aside
            aria-label="Words from our members"
            className="words-shared-aside"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '24px',
              borderRadius: '24px',
              background: '#FFFFFF',
              border: '1px solid #D9DDE6',
              boxShadow: '0 4px 16px rgba(24, 32, 58, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                  fontWeight: 800,
                  fontSize: '22px',
                  lineHeight: '28px',
                  color: '#18203A'
                }}
              >
                Words from our members
              </h2>
              <span
                style={{
                  fontSize: '13px',
                  color: '#6B7389'
                }}
              >
                {filteredWords.length} words
              </span>
            </div>

            {/* Filter by language pills */}
            <div
              role="group"
              aria-label="Filter by language"
              className="words-lang-chips horizontal-scroll-row"
              style={{
                display: 'flex',
                gap: '8px'
              }}
            >
              {availableLanguages.map((lang) => {
                const active = selectedLanguage === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    style={{
                      height: '32px',
                      padding: '0px 14px',
                      borderRadius: '999px',
                      border: active ? '1px solid #18203A' : '1px solid #D9DDE6',
                      background: active ? '#18203A' : '#FFFFFF',
                      color: active ? '#FFFFFF' : '#18203A',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            {/* Member words list */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
              {filteredWords.map((w) => (
                <li
                  key={w.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '14px 0px',
                    borderTop: '1px solid #EEF0F4'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span
                      style={{
                        fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                        fontWeight: 700,
                        fontSize: '19px',
                        lineHeight: '24px',
                        color: '#18203A'
                      }}
                    >
                      {w.word}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '24px',
                        padding: '0px 10px',
                        borderRadius: '999px',
                        background: '#E4E9F4',
                        color: '#18203A',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      {w.language}
                    </span>
                  </div>

                  <span style={{ fontSize: '14px', lineHeight: '21px', color: '#2E3650' }}>
                    {w.meaning}
                  </span>

                  {(w.sharedBy || w.countryName) && (
                    <span style={{ fontSize: '12px', color: '#6B7389' }}>
                      Shared by {w.sharedBy || 'Student'}{w.countryName ? `, ${w.countryName}` : ''}
                    </span>
                  )}
                </li>
              ))}

              {!filteredWords.length && (
                <li style={{ padding: '24px 0', textAlign: 'center', color: '#6B7389', fontSize: '14px' }}>
                  No words shared in {selectedLanguage} yet. Be the first to share one!
                </li>
              )}
            </ul>

            {/* Teach us a word CTA Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '18px',
                borderRadius: '16px',
                background: '#18203A',
                color: '#FFFFFF'
              }}
            >
              <span
                style={{
                  fontFamily: "'Bricolage Grotesque', 'Trebuchet MS', sans-serif",
                  fontWeight: 800,
                  fontSize: '18px',
                  lineHeight: '24px',
                  color: '#FFFFFF'
                }}
              >
                Teach us a word
              </span>
              <span style={{ fontSize: '14px', lineHeight: '21px', color: '#C9D0E4' }}>
                {isStudent
                  ? 'Share a word from your language with everyone in the community.'
                  : 'Share a word from your language with everyone. Log in as a student to add yours.'}
              </span>
              <Link
                to={isStudent ? '/student/words' : '/signin'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#F2B705',
                  color: '#18203A',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E0A200';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F2B705';
                }}
              >
                {isStudent ? 'Share a word' : 'Student login'}
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Responsive Styles (M5) */}
      <style>{`
        @media (max-width: 900px) {
          .words-page-main {
            padding: 24px 16px 48px !important;
            gap: 20px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .learn-word-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            width: 100% !important;
          }
          .word-month-section {
            padding: 22px 18px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .word-month-flex {
            flex-direction: column !important;
            gap: 16px !important;
            width: 100% !important;
          }
          .word-month-info {
            width: 100% !important;
            flex: none !important;
            min-width: 0 !important;
          }
          .word-sentence-box {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            flex-shrink: 1 !important;
          }
          .word-challenge-box {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .everyday-phrases-grid {
            display: flex !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 12px !important;
            padding-bottom: 6px !important;
            scrollbar-width: none !important;
          }
          .everyday-phrases-grid::-webkit-scrollbar {
            display: none !important;
          }
          .everyday-phrases-grid > div {
            min-width: 175px !important;
            flex-shrink: 0 !important;
          }
          .words-shared-aside {
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default WordsPage;
