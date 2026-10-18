import React, { useState, useEffect } from 'react';
import { ExternalLink, Plus, Edit2, Trash2, CheckCircle, Save, Heart } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { TextField } from '../../components/TextField.jsx';
import { Checkbox } from '../../components/Checkbox.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { broadcastWallUpdate } from '../../lib/wallSync.js';

export function StaffContentPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingSection, setSavingSection] = useState({});

  // 1. Word of the Month
  const [wordData, setWordData] = useState({
    word: '',
    pronunciation: '',
    meaning: '',
    exampleRo: '',
    exampleEn: '',
    month: '2026-10',
    published: true
  });

  // 2. Question of the Month
  const [questionData, setQuestionData] = useState({
    question: '',
    month: '2026-10',
    answersOpen: true,
    published: true,
    wallUpvoteColor: '#1E7B4C'
  });

  // 3. Phrases
  const [phrases, setPhrases] = useState([]);
  const [phraseModalOpen, setPhraseModalOpen] = useState(false);
  const [phraseForm, setPhraseForm] = useState({
    romanian: '',
    english: '',
    pronunciation: '',
    status: 'published'
  });

  // 4. Site Settings
  const [settingsData, setSettingsData] = useState({
    welcomeLine: 'Welcome to the University of Craiova',
    heroSubline: 'This is your community. Find your people and make Craiova feel like home.',
    officeEmail: 'international@ucv.ro',
    officeHours: 'Monday–Thursday 10:00–14:00',
    whereToFindUs: 'Main Building, Room 102',
    officialInfoUrl: 'https://www.ucv.ro',
    ambassadorApplyBy: '15 October 2026',
    ambassadorFirstMeeting: 'Wednesday 21 October, 16:00',
    certificateHours: 10,
    privacyNotice: 'UCV International Student Community collects student information solely for international integration, event planning, and student support.'
  });

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/staff/content');

      if (res.word) {
        setWordData({
          word: res.word.word || '',
          pronunciation: res.word.pronunciation || '',
          meaning: res.word.meaning || '',
          exampleRo: res.word.exampleRo || '',
          exampleEn: res.exampleEn || res.word.exampleEn || '',
          month: res.word.month || '2026-10',
          published: res.word.status === 'published'
        });
      }

      if (res.question) {
        setQuestionData({
          question: res.question.question || '',
          month: res.question.month || '2026-10',
          answersOpen: res.question.answersOpen !== false,
          published: res.question.status === 'published' || res.question.isPublished,
          wallUpvoteColor: res.question.wallUpvoteColor || res.settings?.wallUpvoteColor || '#1E7B4C'
        });
      }

      if (res.phrases) {
        setPhrases(res.phrases);
      }

      if (res.settings) {
        setSettingsData({
          welcomeLine: res.settings.welcomeLine || '',
          heroSubline: res.settings.heroSubline || '',
          officeEmail: res.settings.officeEmail || '',
          officeHours: res.settings.officeHours || '',
          whereToFindUs: res.settings.whereToFindUs || '',
          officialInfoUrl: res.settings.officialInfoUrl || 'https://www.ucv.ro',
          ambassadorApplyBy: res.settings.ambassadorApplyBy || '',
          ambassadorFirstMeeting: res.settings.ambassadorFirstMeeting || '',
          certificateHours: res.settings.certificateHours || 10,
          privacyNotice: res.settings.privacyNotice || ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSaveWord = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, word: true }));
      await api.put('/staff/content/word', {
        ...wordData,
        status: wordData.published ? 'published' : 'draft'
      });
      showToast({ message: 'Word of the month saved.', type: 'success' });
    } catch (err) {
      showToast({ message: err.message || 'Failed to save word.', type: 'error' });
    } finally {
      setSavingSection((prev) => ({ ...prev, word: false }));
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, question: true }));
      const colorToSave = questionData.wallUpvoteColor || '#1E7B4C';
      await api.put('/staff/content/question', {
        ...questionData,
        wallUpvoteColor: colorToSave,
        status: questionData.published ? 'published' : 'draft',
        isPublished: questionData.published
      });
      broadcastWallUpdate({
        action: 'color_update',
        wallUpvoteColor: colorToSave
      });
      showToast({ message: 'Question of the month & Wall styling saved.', type: 'success' });
    } catch (err) {
      showToast({ message: err.message || 'Failed to save question.', type: 'error' });
    } finally {
      setSavingSection((prev) => ({ ...prev, question: false }));
    }
  };

  const handleAddPhrase = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, phrase: true }));
      await api.post('/staff/content/phrases', phraseForm);
      showToast({ message: 'Phrase added.', type: 'success' });
      setPhraseModalOpen(false);
      setPhraseForm({ romanian: '', english: '', pronunciation: '', status: 'published' });
      fetchContent();
    } catch (err) {
      showToast({ message: err.message || 'Failed to add phrase.', type: 'error' });
    } finally {
      setSavingSection((prev) => ({ ...prev, phrase: false }));
    }
  };

  const handleDeletePhrase = async (phraseId) => {
    if (!window.confirm('Delete this phrase?')) return;
    try {
      await api.delete(`/staff/content/phrases/${phraseId}`);
      showToast({ message: 'Phrase removed.', type: 'info' });
      fetchContent();
    } catch (err) {
      showToast({ message: err.message || 'Failed to delete phrase.', type: 'error' });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSection((prev) => ({ ...prev, settings: true }));
      await api.put('/staff/content/settings', settingsData);
      showToast({ message: 'Website settings saved.', type: 'success' });
    } catch (err) {
      showToast({ message: err.message || 'Failed to save settings.', type: 'error' });
    } finally {
      setSavingSection((prev) => ({ ...prev, settings: false }));
    }
  };

  if (loading) {
    return (
      <div className="staff-page-container">
        <Skeleton height="40px" width="300px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <Skeleton height="350px" />
          <Skeleton height="350px" />
        </div>
      </div>
    );
  }

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800 }}>
            Website content
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
            Everything here appears on the website and in student dashboards when published.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '44px',
            padding: '0 18px',
            borderRadius: '10px',
            border: '1.5px solid var(--navy)',
            backgroundColor: 'var(--white)',
            color: 'var(--navy)',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none'
          }}
        >
          <ExternalLink size={18} />
          View the website
        </a>
      </header>

      {error && <ErrorAlert message={error} onRetry={fetchContent} />}

      {/* Grid: 2 Columns */}
      <div className="staff-content-grid">
        {/* Column 1: Word of the Month & Phrases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section: Word of the Month */}
          <section className="staff-section-card staff-content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Word of the month
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
                Learn a word, student dashboard
              </span>
            </div>

            <form onSubmit={handleSaveWord} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="staff-form-row">
                <TextField
                  label="Word"
                  required
                  value={wordData.word}
                  onChange={(e) => setWordData({ ...wordData, word: e.target.value })}
                  placeholder="dor"
                />
                <TextField
                  label="How to say it"
                  value={wordData.pronunciation}
                  onChange={(e) => setWordData({ ...wordData, pronunciation: e.target.value })}
                  placeholder='Like "door", with a rolled r'
                />
              </div>

              <TextField
                label="Meaning"
                value={wordData.meaning}
                onChange={(e) => setWordData({ ...wordData, meaning: e.target.value })}
                placeholder="A deep longing for someone or something you love"
              />

              <div className="staff-form-row">
                <TextField
                  label="Example in Romanian"
                  value={wordData.exampleRo}
                  onChange={(e) => setWordData({ ...wordData, exampleRo: e.target.value })}
                  placeholder="Mi-e dor de casă."
                />
                <TextField
                  label="Example in English"
                  value={wordData.exampleEn}
                  onChange={(e) => setWordData({ ...wordData, exampleEn: e.target.value })}
                  placeholder="I miss home."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                <Checkbox
                  label="Published on the website"
                  checked={wordData.published}
                  onChange={(e) => setWordData({ ...wordData, published: e.target.checked })}
                />
                <Button type="submit" loading={savingSection.word}>
                  Save
                </Button>
              </div>
            </form>
          </section>

          {/* Section: Everyday Romanian phrases */}
          <section className="staff-section-card staff-content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Everyday Romanian phrases
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
                Learn a word page
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Romanian</th>
                    <th style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>English</th>
                    <th style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '8px 10px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {phrases.map((p) => (
                    <tr key={p._id || p.id} style={{ borderBottom: '1px solid var(--paper)' }}>
                      <td style={{ padding: '10px', fontWeight: 700 }}>{p.romanian}</td>
                      <td style={{ padding: '10px' }}>{p.english}</td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            height: '22px',
                            padding: '0 8px',
                            borderRadius: '999px',
                            backgroundColor: p.status === 'published' ? '#E8F5EE' : '#EEF0F4',
                            color: p.status === 'published' ? '#17633D' : '#4A536B',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {p.status === 'published' ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeletePhrase(p._id || p.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--brand-red)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Phrase Cards */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {phrases.map((p) => (
                <div
                  key={p._id || p.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)' }}>{p.romanian}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.english}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 'fit-content',
                        height: '20px',
                        padding: '0 6px',
                        borderRadius: '999px',
                        backgroundColor: p.status === 'published' ? '#E8F5EE' : '#EEF0F4',
                        color: p.status === 'published' ? '#17633D' : '#4A536B',
                        fontSize: '10px',
                        fontWeight: 700,
                        marginTop: '4px'
                      }}
                    >
                      {p.status === 'published' ? 'Published' : 'Hidden'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePhrase(p._id || p.id)}
                    aria-label={`Delete ${p.romanian}`}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: 'var(--brand-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setPhraseModalOpen(true)}
              style={{ alignSelf: 'flex-start', marginTop: '6px' }}
            >
              <Plus size={16} />
              Add a phrase
            </Button>
          </section>
        </div>

        {/* Column 2: Question of the Month & Office Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section: Question of the Month */}
          <section className="staff-section-card staff-content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Question of the month
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
                International Wall
              </span>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <TextField
                label="Question"
                required
                value={questionData.question}
                onChange={(e) => setQuestionData({ ...questionData, question: e.target.value })}
                placeholder="What do you hope to discover in Romania?"
              />

              <div className="staff-form-row">
                <TextField
                  label="Month (YYYY-MM)"
                  value={questionData.month}
                  onChange={(e) => setQuestionData({ ...questionData, month: e.target.value })}
                  placeholder="2026-10"
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="answers-open" style={{ fontSize: '15px', fontWeight: 700 }}>
                    Students can answer
                  </label>
                  <select
                    id="answers-open"
                    value={questionData.answersOpen ? 'yes' : 'no'}
                    onChange={(e) => setQuestionData({ ...questionData, answersOpen: e.target.value === 'yes' })}
                    style={{
                      height: '46px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border)',
                      fontSize: '14px',
                      color: 'var(--navy)',
                      backgroundColor: 'var(--white)'
                    }}
                  >
                    <option value="yes">Yes, answers open</option>
                    <option value="no">No, answers closed</option>
                  </select>
                </div>
              </div>

              {/* Upvote Section Colour Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="wall-upvote-color-input" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>
                    “What Our Members Said” Upvote / Me Too Colour
                  </label>
                  {/* Live preview */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: `1.5px solid ${questionData.wallUpvoteColor || '#1E7B4C'}`,
                      backgroundColor: '#E8F5EE',
                      color: '#17633D',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    <Heart size={13} fill={questionData.wallUpvoteColor || '#1E7B4C'} color={questionData.wallUpvoteColor || '#1E7B4C'} />
                    <span>Me too (12)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Green (Selected)', color: '#1E7B4C' },
                    { label: 'Emerald', color: '#10B981' },
                    { label: 'Navy', color: '#18203A' },
                    { label: 'Marigold', color: '#F2B705' },
                    { label: 'Red', color: '#B42318' }
                  ].map((preset) => {
                    const isSelected = (questionData.wallUpvoteColor || '#1E7B4C').toLowerCase() === preset.color.toLowerCase();
                    return (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setQuestionData({ ...questionData, wallUpvoteColor: preset.color })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${preset.color}` : '1.5px solid var(--border)',
                          backgroundColor: isSelected ? '#FFFFFF' : '#F1F4F9',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '12px',
                          color: isSelected ? preset.color : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: preset.color }} />
                        {preset.label}
                      </button>
                    );
                  })}

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Custom:</span>
                    <input
                      id="wall-upvote-color-input"
                      type="color"
                      aria-label="Custom upvote colour"
                      value={questionData.wallUpvoteColor || '#1E7B4C'}
                      onChange={(e) => setQuestionData({ ...questionData, wallUpvoteColor: e.target.value })}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        border: '1.5px solid var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                <Checkbox
                  label="Published on the website"
                  checked={questionData.published}
                  onChange={(e) => setQuestionData({ ...questionData, published: e.target.checked })}
                />
                <Button type="submit" loading={savingSection.question}>
                  Save
                </Button>
              </div>
            </form>
          </section>

          {/* Section: Office details and home page */}
          <section className="staff-section-card staff-content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Office details and home page
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
                Home & Footer
              </span>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <TextField
                label="Home page welcome headline"
                value={settingsData.welcomeLine}
                onChange={(e) => setSettingsData({ ...settingsData, welcomeLine: e.target.value })}
                placeholder="Welcome to the University of Craiova"
              />

              <TextField
                label="Hero subline"
                value={settingsData.heroSubline}
                onChange={(e) => setSettingsData({ ...settingsData, heroSubline: e.target.value })}
              />

              <TextField
                label="Office email"
                type="email"
                value={settingsData.officeEmail}
                onChange={(e) => setSettingsData({ ...settingsData, officeEmail: e.target.value })}
              />

              <TextField
                label="Office hours"
                value={settingsData.officeHours}
                onChange={(e) => setSettingsData({ ...settingsData, officeHours: e.target.value })}
              />

              <TextField
                label="Where to find us"
                value={settingsData.whereToFindUs}
                onChange={(e) => setSettingsData({ ...settingsData, whereToFindUs: e.target.value })}
              />

              <TextField
                label="Official information link"
                value={settingsData.officialInfoUrl}
                onChange={(e) => setSettingsData({ ...settingsData, officialInfoUrl: e.target.value })}
              />

              <div className="staff-form-row">
                <TextField
                  label="Ambassador apply by"
                  value={settingsData.ambassadorApplyBy}
                  onChange={(e) => setSettingsData({ ...settingsData, ambassadorApplyBy: e.target.value })}
                />
                <TextField
                  label="Certificate threshold (hours)"
                  type="number"
                  value={settingsData.certificateHours}
                  onChange={(e) => setSettingsData({ ...settingsData, certificateHours: Number(e.target.value) })}
                />
              </div>

              {/* Privacy notice textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="privacyNotice" style={{ fontSize: '15px', fontWeight: 700 }}>
                  Privacy notice (shown on /privacy)
                </label>
                <textarea
                  id="privacyNotice"
                  rows={4}
                  value={settingsData.privacyNotice}
                  onChange={(e) => setSettingsData({ ...settingsData, privacyNotice: e.target.value })}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    lineHeight: '20px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <Button type="submit" loading={savingSection.settings}>
                  Save settings
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* Add Phrase Modal */}
      <Modal isOpen={phraseModalOpen} onClose={() => setPhraseModalOpen(false)} title="Add Romanian phrase">
        <form onSubmit={handleAddPhrase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TextField
            label="Romanian phrase"
            required
            value={phraseForm.romanian}
            onChange={(e) => setPhraseForm({ ...phraseForm, romanian: e.target.value })}
            placeholder="e.g. Bună ziua"
          />
          <TextField
            label="English translation"
            required
            value={phraseForm.english}
            onChange={(e) => setPhraseForm({ ...phraseForm, english: e.target.value })}
            placeholder="e.g. Good day"
          />
          <TextField
            label="Pronunciation / Note (optional)"
            value={phraseForm.pronunciation}
            onChange={(e) => setPhraseForm({ ...phraseForm, pronunciation: e.target.value })}
            placeholder="e.g. BOO-nuh ZEE-wah"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setPhraseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingSection.phrase}>
              Add phrase
            </Button>
          </div>
        </form>
      </Modal>

      <style>{`
        .staff-content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 20px;
          align-items: start;
        }
        .staff-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 900px) {
          .staff-content-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .staff-form-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .staff-content-card {
            padding: 16px !important;
            border-radius: 16px !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
