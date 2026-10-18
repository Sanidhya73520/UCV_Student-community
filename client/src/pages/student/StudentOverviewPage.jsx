import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Users,
  Award,
  ArrowUp,
  Download,
  Check
} from 'lucide-react';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatWallDate } from '../../lib/dateUtils.js';
import { getProgrammeLabel } from '../../../../shared/faculties.js';
import { broadcastRsvpUpdate } from '../../lib/activitySync.js';

export function StudentOverviewPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpConfirmModal, setRsvpConfirmModal] = useState(null);

  // Form states
  const [askTopic, setAskTopic] = useState('events');
  const [askText, setAskText] = useState('');
  const [askSubmitting, setAskSubmitting] = useState(false);
  const [askSent, setAskSent] = useState(false);

  const [wallText, setWallText] = useState('');
  const [wallSubmitting, setWallSubmitting] = useState(false);
  const [wallSent, setWallSent] = useState(false);
  const [showWallForm, setShowWallForm] = useState(false);

  const [wordWord, setWordWord] = useState('');
  const [wordLang, setWordLang] = useState('');
  const [wordMeaning, setWordMeaning] = useState('');
  const [wordSubmitting, setWordSubmitting] = useState(false);
  const [wordSent, setWordSent] = useState(false);
  const [showWordForm, setShowWordForm] = useState(false);

  const [clubName, setClubName] = useState('');
  const [clubHelp, setClubHelp] = useState(false);
  const [clubSubmitting, setClubSubmitting] = useState(false);
  const [clubSent, setClubSent] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/me/dashboard');
        setData(res);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const handleRsvp = async (activityId, response) => {
    if (!activityId) return;
    const act = (data?.activities || []).find((a) => a.id === activityId) || data?.nextActivity;
    const activityTitle = act?.title || 'this activity';

    try {
      const res = await api.post('/me/rsvp', {
        activityId,
        response
      });
      if (res?.ok) {
        const isGoing = response === 'going';
        setRsvpConfirmModal({
          title: isGoing ? "RSVP Confirmed: You're going!" : "Response Recorded: Can't make it",
          message: isGoing
            ? `You're all set for "${activityTitle}". We've added this event to your plan and notified the coordinator.`
            : `We've recorded that you can't make it to "${activityTitle}". If your plans change, you can switch back to "I'm going" at any time.`,
          isGoing
        });

        toast.show(isGoing ? `RSVP confirmed for "${activityTitle}"!` : `Response updated: Can't make it to "${activityTitle}".`);

        broadcastRsvpUpdate({
          activityId,
          response,
          goingCount: res.goingCount,
          notGoingCount: res.notGoingCount,
          studentName: user?.fullName || 'Student',
          studentCountry: user?.countryCode || '',
          studentFaculty: user?.faculty || ''
        });

        setData((prev) => {
          if (!prev) return prev;
          const updatedActivities = (prev.activities || []).map((a) =>
            a.id === activityId
              ? { ...a, userRsvp: response, goingCount: res.goingCount, notGoingCount: res.notGoingCount }
              : a
          );
          const updatedNext =
            prev.nextActivity?.id === activityId
              ? { ...prev.nextActivity, userRsvp: response, goingCount: res.goingCount, notGoingCount: res.notGoingCount }
              : prev.nextActivity;

          return {
            ...prev,
            activities: updatedActivities,
            nextActivity: updatedNext
          };
        });
      }
    } catch (err) {
      toast.show(err.message || 'Could not update RSVP', 'error');
    }
  };

  const handleSendAsk = async (e) => {
    e.preventDefault();
    if (!askText.trim()) return;
    setAskSubmitting(true);
    try {
      const res = await api.post('/me/questions', { topic: askTopic, text: askText });
      if (res?.ok) {
        setAskSent(true);
        setAskText('');
        setData((prev) => ({
          ...prev,
          myQuestions: [res.question, ...(prev.myQuestions || [])]
        }));
        toast.show('Question sent to the coordinator.');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to submit question', 'error');
    } finally {
      setAskSubmitting(false);
    }
  };

  const handlePostWall = async (e) => {
    e.preventDefault();
    if (!wallText.trim()) return;
    const postContent = wallText.trim();
    // Instant optimistic update in nanoseconds
    const optimisticPost = {
      id: String(Date.now()),
      text: postContent,
      state: 'visible',
      meTooCount: 0,
      createdAt: new Date().toISOString()
    };
    setData((prev) => ({
      ...prev,
      myWallPost: optimisticPost
    }));
    setShowWallForm(false);
    setWallText('');
    setWallSent(true);
    setWallSubmitting(true);
    try {
      const res = await api.post('/me/wall/posts', { text: postContent });
      if (res?.ok) {
        setData((prev) => ({
          ...prev,
          myWallPost: res.post || optimisticPost
        }));
        toast.show('Posted! Your answer is visible to the community.');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to post on the wall', 'error');
    } finally {
      setWallSubmitting(false);
    }
  };

  const handleSendWord = async (e) => {
    e.preventDefault();
    if (!wordWord.trim() || !wordLang.trim() || !wordMeaning.trim()) return;
    const newWord = {
      id: String(Date.now()),
      word: wordWord.trim(),
      language: wordLang.trim(),
      meaning: wordMeaning.trim(),
      createdAt: new Date().toISOString()
    };
    // Instant optimistic update in nanoseconds
    setData((prev) => ({
      ...prev,
      mySharedWord: newWord
    }));
    setShowWordForm(false);
    setWordWord('');
    setWordLang('');
    setWordMeaning('');
    setWordSent(true);
    setWordSubmitting(true);
    try {
      const res = await api.post('/me/words', {
        word: newWord.word,
        language: newWord.language,
        meaning: newWord.meaning
      });
      if (res?.ok) {
        setData((prev) => ({
          ...prev,
          mySharedWord: res.sharedWord || newWord
        }));
        toast.show('Word shared with everyone!');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to share word', 'error');
    } finally {
      setWordSubmitting(false);
    }
  };

  const handleSendClub = async (e) => {
    e.preventDefault();
    if (!clubName.trim()) return;
    const proposedClubName = clubName.trim();
    const wantsHelp = Boolean(clubHelp);
    const optimisticProposal = {
      id: String(Date.now()),
      name: proposedClubName,
      wantsToHelp: wantsHelp,
      status: 'received',
      createdAt: new Date().toISOString()
    };
    // Instant optimistic update in nanoseconds
    setData((prev) => ({
      ...prev,
      myProposals: [optimisticProposal, ...(prev?.myProposals || [])]
    }));
    setClubName('');
    setClubHelp(false);
    setClubSent(true);
    setClubSubmitting(true);
    try {
      const res = await api.post('/me/clubs/proposals', {
        name: proposedClubName,
        wantsToHelp: wantsHelp
      });
      if (res?.ok) {
        setData((prev) => ({
          ...prev,
          myProposals: [
            res.proposal || optimisticProposal,
            ...(prev?.myProposals || []).filter((p) => p.id !== optimisticProposal.id)
          ]
        }));
        toast.show('Thanks! The International Relations team will review your idea.');
      }
    } catch (err) {
      toast.show(err.message || 'Failed to propose club', 'error');
    } finally {
      setClubSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="40px" width="280px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <Skeleton height="260px" style={{ borderRadius: '20px' }} />
          <Skeleton height="260px" style={{ borderRadius: '20px' }} />
        </div>
      </div>
    );
  }

  const student = data?.student || user;
  const activities = data?.activities?.length ? data.activities : (data?.nextActivity ? [data.nextActivity] : []);
  const myQuestions = data?.myQuestions || [];
  const currentQ = data?.currentQuestion;
  const myWallPost = data?.myWallPost;
  const wordMonth = data?.wordOfTheMonth;
  const mySharedWord = data?.mySharedWord;
  const myUpvotes = data?.myUpvotes || [];
  const myProposals = data?.myProposals || [];
  const ambStatus = data?.ambassadorStatus || 'not_applied';
  const myAmbassadorApplication = data?.myAmbassadorApplication;
  const isAmbassador = Boolean(data?.isAmbassador);
  const loggedHours = data?.ambassadorHoursLogged || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '38px',
            lineHeight: '44px',
            letterSpacing: '-0.5px',
            color: '#18203A'
          }}
        >
          Bună, {student?.firstName || 'there'}
        </h1>
        <p style={{ margin: 0, fontSize: '17px', color: '#4A536B' }}>
          That's "hi" in Romanian. Here's what's happening in the community.
        </p>
      </div>

      {/* 2-Column Top Grid: Activities & Ask Coordinator */}
      <div className="student-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Published Activities Section */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#B42318' }}>
              {activities.length > 1 ? `Activities (${activities.length})` : 'Next activity'}
            </span>
            <Link to="/student/events" style={{ fontSize: '15px', fontWeight: 700, color: '#B42318' }}>
              All my events
            </Link>
          </div>

          {activities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {activities.map((act, index) => {
                let mon = 'Upcoming';
                let day = '';
                let whenStr = act.targetMonth ? `In ${act.targetMonth}` : '[Date and time to be confirmed]';
                if (act.date) {
                  const d = new Date(act.date);
                  mon = d.toLocaleDateString('en-GB', { month: 'short' });
                  day = String(d.getDate());
                  const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
                  whenStr = `${dayName} ${day} ${d.toLocaleDateString('en-GB', { month: 'long' })}${act.startTime ? `, ${act.startTime}` : ''}${act.endTime ? ` to ${act.endTime}` : ''}`;
                }

                return (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      paddingBottom: index < activities.length - 1 ? '20px' : 0,
                      borderBottom: index < activities.length - 1 ? '1px solid #EEF0F4' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '76px',
                          height: '84px',
                          flexShrink: 0,
                          borderRadius: '14px',
                          backgroundColor: mon.toLowerCase().includes('oct') ? '#B42318' : '#18203A',
                          color: '#FFFFFF',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{mon}</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '32px', lineHeight: '34px' }}>
                          {day || '—'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', lineHeight: '28px', color: '#18203A' }}>
                            {act.title}
                          </h2>
                          {act.goingCount > 0 && (
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#17633D', backgroundColor: '#E8F5EE', padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                              {act.goingCount} going
                            </span>
                          )}
                        </div>

                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4A536B' }}>
                          <Clock size={15} />
                          {whenStr}
                        </span>

                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4A536B' }}>
                          <MapPin size={15} />
                          {act.venue || '[Venue to be confirmed]'}
                        </span>

                        {act.slug && (
                          <Link to={`/activities/${act.slug}`} style={{ fontSize: '13px', fontWeight: 700, color: '#B42318', marginTop: '2px', alignSelf: 'flex-start' }}>
                            See itinerary →
                          </Link>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#18203A' }}>
                        Are you coming?
                      </span>

                      {act.userRsvp && (
                        <span style={{ fontSize: '13px', color: act.userRsvp === 'going' ? '#17633D' : '#6B7389', fontWeight: 600 }}>
                          {act.userRsvp === 'going' ? "✓ You're going" : "✗ You replied: Can't make it"} (tap to change)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <button
                        type="button"
                        aria-pressed={act.userRsvp === 'going'}
                        onClick={() => handleRsvp(act.id, 'going')}
                        style={{
                          height: '44px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '15px',
                          border: '2px solid',
                          borderColor: act.userRsvp === 'going' ? '#18203A' : '#C3C9D6',
                          backgroundColor: act.userRsvp === 'going' ? '#18203A' : '#FFFFFF',
                          color: act.userRsvp === 'going' ? '#FFFFFF' : '#18203A',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {act.userRsvp === 'going' && <Check size={16} />}
                        I'm going
                      </button>

                      <button
                        type="button"
                        aria-pressed={act.userRsvp === 'not_going'}
                        onClick={() => handleRsvp(act.id, 'not_going')}
                        style={{
                          height: '44px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '15px',
                          border: '2px solid',
                          borderColor: act.userRsvp === 'not_going' ? '#18203A' : '#C3C9D6',
                          backgroundColor: act.userRsvp === 'not_going' ? '#18203A' : '#FFFFFF',
                          color: act.userRsvp === 'not_going' ? '#FFFFFF' : '#18203A',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {act.userRsvp === 'not_going' && <Check size={16} />}
                        Can't make it
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <span style={{ fontSize: '15px', color: '#4A536B' }}>No upcoming activities right now.</span>
          )}
        </section>

        {/* Ask the Coordinator Section */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#FDF3D3',
                color: '#8A6D00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle size={22} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', lineHeight: '28px', color: '#18203A' }}>
                Ask the coordinator
              </h2>
              <span style={{ fontSize: '14px', color: '#4A536B' }}>Goes straight to the International Relations team</span>
            </div>
          </div>

          <form onSubmit={handleSendAsk} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select
              value={askTopic}
              onChange={(e) => setAskTopic(e.target.value)}
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
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              rows={2}
              placeholder="Write your question"
              style={{
                minHeight: '76px',
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
              disabled={askSubmitting || !askText.trim()}
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
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
              Send my question
            </button>
          </form>

          {askSent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#E8F5EE', color: '#17633D', fontWeight: 700, fontSize: '14px' }}>
              <Check size={16} />
              Sent. The answer will appear under My questions.
            </div>
          )}

          {/* Quick list of my questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1px solid #E6E9F0' }}>
            <Link to="/student/questions" style={{ fontSize: '14px', fontWeight: 700, color: '#B42318', paddingTop: '4px' }}>
              See my questions and answers
            </Link>
            {myQuestions.slice(0, 2).map((q) => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: '#18203A' }}>{q.text}</span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: q.status === 'answered' ? '#E8F5EE' : '#FDF3D3',
                    color: q.status === 'answered' ? '#17633D' : '#5C4A00',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {q.status === 'answered' ? 'Answered' : 'Waiting'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 3-Column Middle Grid: International Wall / Learn a Word / Shape our clubs */}
      <div className="student-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* International Wall Card */}
        <section
          className="student-card"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#FBEAE9',
                  color: '#B42318',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MessageSquare size={18} />
              </span>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', color: '#18203A' }}>
                International Wall
              </h2>
            </div>
            <Link to="/student/wall" style={{ fontSize: '13px', fontWeight: 700, color: '#B42318', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Full Wall &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#B42318', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {currentQ?.createdAt ? `Prompt • ${formatWallDate(currentQ.createdAt)}` : 'Monthly Question'}
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '17px', lineHeight: '23px', color: '#18203A' }}>
              {currentQ?.question || 'What do you hope to discover in Romania?'}
            </span>
          </div>

          {myWallPost && !showWallForm ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                backgroundColor: '#F8F9FB',
                border: '1.5px solid #E6E9F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#4A536B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your posted answer
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: myWallPost.state === 'removed' ? '#FEE4E2' : '#E8F5EE',
                    color: myWallPost.state === 'removed' ? '#B42318' : '#17633D'
                  }}
                >
                  {myWallPost.state === 'removed' ? 'Removed' : 'Visible on Wall'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '15px', lineHeight: '21px', color: '#18203A', fontWeight: 500 }}>
                "{myWallPost.text}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #EEF0F4' }}>
                <span style={{ fontSize: '12px', color: '#8E99B7' }}>
                  {myWallPost.createdAt ? `Shared ${formatWallDate(myWallPost.createdAt)}` : 'Shared with community'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowWallForm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#B42318',
                    cursor: 'pointer'
                  }}
                >
                  Update answer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePostWall} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                value={wallText}
                onChange={(e) => setWallText(e.target.value)}
                rows={3}
                placeholder="Write your answer to the community prompt..."
                style={{
                  minHeight: '80px',
                  padding: '12px',
                  border: '1.5px solid #C3C9D6',
                  borderRadius: '12px',
                  fontSize: '14px',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={wallSubmitting || !wallText.trim()}
                  style={{
                    height: '38px',
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
                  {wallSubmitting ? 'Posting...' : 'Post my answer'}
                </button>
                {myWallPost && (
                  <button
                    type="button"
                    onClick={() => setShowWallForm(false)}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #D9DDE6',
                      backgroundColor: '#FFFFFF',
                      color: '#4A536B',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {wallSent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#E8F5EE', color: '#17633D', fontWeight: 700, fontSize: '13px' }}>
              <Check size={16} />
              Answer posted in real-time! Visible on the International Wall.
            </div>
          )}
        </section>

        {/* Learn a Word Card */}
        <section
          className="student-card"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#EBF4FF',
                  color: '#1D4ED8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookOpen size={18} />
              </span>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', color: '#18203A' }}>
                Learn a Word
              </h2>
            </div>
            <Link to="/student/words" style={{ fontSize: '13px', fontWeight: 700, color: '#B42318', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              All words &rarr;
            </Link>
          </div>

          {/* Romanian Word of the Month to learn */}
          <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F2F4F8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Romanian word to learn
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, color: '#18203A' }}>
                {wordMonth?.word || 'dor'}
              </span>
              <span style={{ fontSize: '13px', color: '#4A536B' }}>
                — {wordMonth?.meaning || 'deep longing or yearning'}
              </span>
            </div>
          </div>

          {/* Student's Designated Shared Word */}
          {mySharedWord && !showWordForm ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                backgroundColor: '#F8F9FB',
                border: '1.5px solid #E6E9F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#4A536B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your shared word
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#E8F5EE',
                    color: '#17633D'
                  }}
                >
                  Shared with community
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '19px', fontWeight: 800, color: '#18203A' }}>
                  {mySharedWord.word}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#4A536B' }}>
                  ({mySharedWord.language})
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#2E3650' }}>
                "{mySharedWord.meaning}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid #EEF0F4' }}>
                <button
                  type="button"
                  onClick={() => setShowWordForm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#B42318',
                    cursor: 'pointer'
                  }}
                >
                  + Share another word
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendWord} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4A536B' }}>
                Teach us a word from your native language:
              </span>
              <div className="student-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Word"
                  value={wordWord}
                  onChange={(e) => setWordWord(e.target.value)}
                  style={{ height: '38px', padding: '0 12px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '14px' }}
                />
                <input
                  type="text"
                  placeholder="Language"
                  value={wordLang}
                  onChange={(e) => setWordLang(e.target.value)}
                  style={{ height: '38px', padding: '0 12px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '14px' }}
                />
              </div>
              <input
                type="text"
                placeholder="What it means in English"
                value={wordMeaning}
                onChange={(e) => setWordMeaning(e.target.value)}
                style={{ height: '38px', padding: '0 12px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '14px' }}
              />
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={wordSubmitting || !wordWord.trim()}
                  style={{
                    height: '38px',
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
                  {wordSubmitting ? 'Sharing...' : 'Share word'}
                </button>
                {mySharedWord && (
                  <button
                    type="button"
                    onClick={() => setShowWordForm(false)}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #D9DDE6',
                      backgroundColor: '#FFFFFF',
                      color: '#4A536B',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {wordSent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#E8F5EE', color: '#17633D', fontWeight: 700, fontSize: '13px' }}>
              <Check size={16} />
              Shared in real-time! Visible under Learn a word.
            </div>
          )}
        </section>

        {/* Shape our clubs Card */}
        <section
          className="student-card"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#E8F5EE',
                  color: '#1E7B4C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={18} />
              </span>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', color: '#18203A' }}>
                Shape our clubs
              </h2>
            </div>
            <Link to="/student/clubs" style={{ fontSize: '13px', fontWeight: 700, color: '#B42318', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              All clubs &rarr;
            </Link>
          </div>

          {/* Section: Your Upvotes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#4A536B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your club upvotes ({myUpvotes.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {myUpvotes.length === 0 ? (
                <span style={{ fontSize: '13px', color: '#8E99B7' }}>No upvoted clubs yet</span>
              ) : (
                myUpvotes.map((u) => (
                  <span
                    key={u.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      height: '28px',
                      padding: '0 10px',
                      borderRadius: '999px',
                      backgroundColor: '#1E7B4C',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    <ArrowUp size={12} strokeWidth={2.6} />
                    {u.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Section: Your Proposed Clubs */}
          {myProposals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px', borderTop: '1px solid #EEF0F4' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#4A536B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Your proposed clubs ({myProposals.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {myProposals.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#F8F9FB',
                      border: '1px solid #E6E9F0'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '13px', color: '#18203A' }}>{p.name}</strong>
                      <span style={{ fontSize: '11px', color: '#6A7287' }}>
                        {p.wantsToHelp ? 'Volunteered to lead' : 'Idea submitted'}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: p.status === 'approved' ? '#E8F5EE' : '#FDF3D3',
                        color: p.status === 'approved' ? '#17633D' : '#5C4A00'
                      }}
                    >
                      {p.status === 'approved' ? 'Approved' : 'Under review'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Propose Club Form */}
          <form onSubmit={handleSendClub} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#18203A' }}>
              Propose a new club:
            </span>
            <input
              type="text"
              placeholder="e.g. Board Games, Photography, Coding"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              style={{ height: '38px', padding: '0 12px', border: '1.5px solid #C3C9D6', borderRadius: '10px', fontSize: '14px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#18203A', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={clubHelp}
                onChange={(e) => setClubHelp(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#B42318' }}
              />
              I'd like to help run it
            </label>
            <button
              type="submit"
              disabled={clubSubmitting || !clubName.trim()}
              style={{
                alignSelf: 'flex-start',
                height: '38px',
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
              {clubSubmitting ? 'Submitting...' : 'Propose club'}
            </button>
          </form>

          {clubSent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#E8F5EE', color: '#17633D', fontWeight: 700, fontSize: '13px' }}>
              <Check size={16} />
              Proposal submitted in real-time! The IR team will review your idea.
            </div>
          )}
        </section>
      </div>

      {/* 2-Column Bottom Grid: Ambassadors & Profile */}
      <div className="student-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Ambassadors Section */}
        <section
          className="student-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: isAmbassador ? '#E8F5EE' : '#FDF3D3',
                  color: isAmbassador ? '#1E7B4C' : '#8A6D00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Award size={22} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', color: '#18203A' }}>
                  {isAmbassador ? 'Student Ambassador' : 'Become an ambassador'}
                </h2>
                <span style={{ fontSize: '13px', color: '#4A536B' }}>
                  {isAmbassador ? 'Official UCV Ambassador Representative' : 'Help new international students feel at home in Craiova'}
                </span>
              </div>
            </div>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: isAmbassador
                  ? '#E8F5EE'
                  : myAmbassadorApplication?.status === 'pending'
                  ? '#FDF3D3'
                  : '#F2F3F6',
                color: isAmbassador
                  ? '#17633D'
                  : myAmbassadorApplication?.status === 'pending'
                  ? '#5C4A00'
                  : '#4A536B',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {isAmbassador
                ? 'Active Ambassador'
                : myAmbassadorApplication?.status === 'pending'
                ? 'Application Under Review'
                : 'Open for Applications'}
            </span>
          </div>

          {/* If Active Ambassador */}
          {isAmbassador ? (
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#F8F9FB',
                border: '1.5px solid #E6E9F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#18203A' }}>
                  Volunteering & Activities Tracker
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E7B4C' }}>
                  {loggedHours} hours logged
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#4A536B' }}>
                You are an approved UCV International Student Ambassador. Track your volunteering sessions, earn your certificate, and connect with peers.
              </p>
              <Link
                to="/student/ambassadors"
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '38px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  backgroundColor: '#B42318',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                Open Ambassador Portal
              </Link>
            </div>
          ) : myAmbassadorApplication ? (
            /* If Application Submitted */
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#F8F9FB',
                border: '1.5px solid #E6E9F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#4A536B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your Submitted Application
                </span>
                <span style={{ fontSize: '12px', color: '#8E99B7' }}>
                  {myAmbassadorApplication.createdAt ? `Submitted ${formatWallDate(myAmbassadorApplication.createdAt)}` : 'Submitted'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6A7287', display: 'block' }}>Languages:</span>
                  <strong style={{ color: '#18203A' }}>{myAmbassadorApplication.languages || 'English'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6A7287', display: 'block' }}>Monthly Commitment:</span>
                  <strong style={{ color: '#18203A' }}>
                    {myAmbassadorApplication.hoursPerMonth === '4_to_8'
                      ? '4 to 8 hours / month'
                      : myAmbassadorApplication.hoursPerMonth === '2_to_4'
                      ? '2 to 4 hours / month'
                      : '8+ hours / month'}
                  </strong>
                </div>
              </div>

              {myAmbassadorApplication.why && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#6A7287' }}>Why you want to be an ambassador:</span>
                  <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: '#2E3650', backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EEF0F4' }}>
                    "{myAmbassadorApplication.why}"
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #EEF0F4' }}>
                <span style={{ fontSize: '13px', color: '#5C4A00', fontWeight: 600 }}>
                  Status: The IR team will contact you for a brief chat.
                </span>
                <Link
                  to="/student/ambassadors"
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#B42318',
                    textDecoration: 'none'
                  }}
                >
                  View full application &rarr;
                </Link>
              </div>
            </div>
          ) : (
            /* Not Applied Yet */
            <>
              <span style={{ fontSize: '15px', lineHeight: '22px', color: '#2E3650' }}>
                Welcome new students, help run activities and get a volunteering certificate.
              </span>

              <ol className="ambassador-steps-grid" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <li
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#F2F3F6',
                    fontSize: '13px'
                  }}
                >
                  <strong>1. Apply</strong>
                  <span style={{ color: '#4A536B' }}>Takes 2 minutes</span>
                </li>
                <li
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#F2F3F6',
                    fontSize: '13px'
                  }}
                >
                  <strong>2. Short chat</strong>
                  <span style={{ color: '#4A536B' }}>With the IR team</span>
                </li>
                <li
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#F2F3F6',
                    fontSize: '13px'
                  }}
                >
                  <strong>3. Welcome</strong>
                  <span style={{ color: '#4A536B' }}>Join the team</span>
                </li>
              </ol>

              <Link
                to="/student/ambassadors"
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '42px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  backgroundColor: '#B42318',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                Apply now
              </Link>
            </>
          )}
        </section>

        {/* My Profile Section */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D9DDE6',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px', color: '#18203A' }}>
              My profile
            </h2>
            <Link
              to="/student/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: '40px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1.5px solid #18203A',
                backgroundColor: '#FFFFFF',
                color: '#18203A',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              Edit
            </Link>
          </div>

          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 20px', fontSize: '15px' }}>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Country</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {student?.countryName}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Email</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {student?.email}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Mobile number</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {student?.mobile || 'Not set'}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Programme</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {getProgrammeLabel(student?.programme)}
              </dd>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <dt style={{ fontSize: '13px', color: '#4A536B' }}>Faculty / Programme enrolled</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 700, color: '#18203A' }}>
                {student?.faculty || 'Not set'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* RSVP Confirmation Modal Dialog */}
      {rsvpConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rsvp-dialog-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(24, 32, 58, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setRsvpConfirmModal(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(24, 32, 58, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              border: '1px solid #D9DDE6'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: rsvpConfirmModal.isGoing ? '#E8F5EE' : '#F2F3F6',
                  color: rsvpConfirmModal.isGoing ? '#17633D' : '#4A536B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800
                }}
              >
                {rsvpConfirmModal.isGoing ? '✓' : 'ℹ'}
              </div>
              <h3
                id="rsvp-dialog-title"
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#18203A'
                }}
              >
                {rsvpConfirmModal.title}
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '15px', lineHeight: '22px', color: '#2E3650' }}>
              {rsvpConfirmModal.message}
            </p>

            <button
              type="button"
              onClick={() => setRsvpConfirmModal(null)}
              style={{
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#18203A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .student-overview-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }

        @media (max-width: 600px) {
          .student-card {
            padding: 18px 16px !important;
            border-radius: 16px !important;
          }
          .student-form-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .ambassador-steps-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
