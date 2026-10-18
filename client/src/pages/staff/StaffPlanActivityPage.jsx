import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { TextField } from '../../components/TextField.jsx';
import { Checkbox } from '../../components/Checkbox.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';

export function StaffPlanActivityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [dateToConfirm, setDateToConfirm] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [month, setMonth] = useState('2026-10');
  const [venue, setVenue] = useState('[Venue]');
  const [summary, setSummary] = useState('');
  const [cost, setCost] = useState('free');
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [quote, setQuote] = useState('');
  const [feedbackUrl, setFeedbackUrl] = useState('');

  // Itinerary steps: [{ time, title, detail }]
  const [steps, setSteps] = useState([
    { time: '18:00', title: 'Welcome and check-in' },
    { time: '18:30', title: 'Main event programme' },
    { time: '19:30', title: 'Socialising and wrap-up' }
  ]);

  // Optional lists
  const [whatToBring, setWhatToBring] = useState([]);
  const [newBringItem, setNewBringItem] = useState('');
  const [goodToKnow, setGoodToKnow] = useState([]);
  const [newKnowItem, setNewKnowItem] = useState('');

  // Internal staff checklist: [{ text, done }]
  const [checklist, setChecklist] = useState([
    { text: 'Book the room with university logistics', done: true },
    { text: 'Create event banner and flyer', done: false },
    { text: 'Post on WhatsApp announcements', done: false },
    { text: 'Prepare name tags and supplies', done: false }
  ]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (isEditing) {
      async function fetchActivity() {
        try {
          setLoading(true);
          const act = await api.get(`/staff/activities/${id}`);
          if (act) {
            setTitle(act.title || '');
            setDateToConfirm(Boolean(act.dateToConfirm));
            setDate(act.date ? new Date(act.date).toISOString().slice(0, 10) : '');
            setStartTime(act.startTime || '18:00');
            setEndTime(act.endTime || '20:00');
            setMonth(act.month || '2026-10');
            setVenue(act.venue || '[Venue]');
            setSummary(act.summary || '');
            setCost(act.cost || 'free');
            setRsvpEnabled(act.rsvpEnabled !== false);
            setQuote(act.quote || '');
            setFeedbackUrl(act.feedbackUrl || '');
            if (act.itinerary?.length) setSteps(act.itinerary);
            if (act.whatToBring?.length) setWhatToBring(act.whatToBring);
            if (act.goodToKnow?.length) setGoodToKnow(act.goodToKnow);
            if (act.checklist?.length) setChecklist(act.checklist);
          }
        } catch (err) {
          setError(err.message || 'Failed to load activity details.');
        } finally {
          setLoading(false);
        }
      }
      fetchActivity();
    }
  }, [id, isEditing]);

  const handleAddStep = () => {
    setSteps([...steps, { time: '', title: '' }]);
  };

  const handleRemoveStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleAddBring = () => {
    if (newBringItem.trim()) {
      setWhatToBring([...whatToBring, newBringItem.trim()]);
      setNewBringItem('');
    }
  };

  const handleRemoveBring = (index) => {
    setWhatToBring(whatToBring.filter((_, i) => i !== index));
  };

  const handleAddKnow = () => {
    if (newKnowItem.trim()) {
      setGoodToKnow([...goodToKnow, newKnowItem.trim()]);
      setNewKnowItem('');
    }
  };

  const handleRemoveKnow = (index) => {
    setGoodToKnow(goodToKnow.filter((_, i) => i !== index));
  };

  const handleAddChecklist = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { text: newChecklistItem.trim(), done: false }]);
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklist = (index) => {
    const updated = [...checklist];
    updated[index].done = !updated[index].done;
    setChecklist(updated);
  };

  const handleRemoveChecklist = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSave = async (statusToSet = 'draft') => {
    if (!title.trim()) {
      setError('Please provide an activity name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        title: title.trim(),
        dateToConfirm,
        date: date ? new Date(date).toISOString() : null,
        startTime,
        endTime,
        month: month || (date ? date.slice(0, 7) : '2026-10'),
        venue: venue.trim() || '[Venue]',
        summary: summary.trim(),
        cost,
        rsvpEnabled,
        itinerary: steps.filter((s) => s.title.trim()),
        whatToBring,
        goodToKnow,
        quote: quote.trim() || undefined,
        feedbackUrl: feedbackUrl.trim() || undefined,
        checklist,
        status: statusToSet
      };

      if (isEditing) {
        await api.put(`/staff/activities/${id}`, payload);
        showToast({ message: 'Activity updated successfully.', type: 'success' });
      } else {
        await api.post('/staff/activities', payload);
        showToast({
          message: statusToSet === 'published' ? 'Activity published!' : 'Activity saved as draft.',
          type: 'success'
        });
      }

      navigate('/staff/activities');
    } catch (err) {
      setError(err.message || 'Failed to save activity.');
    } finally {
      setSubmitting(false);
    }
  };

  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="staff-page-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/staff/activities" style={{ color: 'var(--navy)', textDecoration: 'none' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800 }}>
              {isEditing ? 'Edit activity' : 'Plan an activity'}
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 30px', color: 'var(--text-muted)', fontSize: '15px' }}>
            Fill in the details, build the itinerary and keep track of what to prepare.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave('draft')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '44px',
              padding: '0 18px',
              borderRadius: '10px',
              border: '1.5px solid var(--navy)',
              backgroundColor: 'var(--white)',
              color: 'var(--navy)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Save draft
          </button>

          <Button
            type="button"
            loading={submitting}
            onClick={() => handleSave('published')}
          >
            Publish
          </Button>
        </div>
      </header>

      {error && <ErrorAlert message={error} />}

      {/* Main Form + Sidebar Layout */}
      <div className="staff-plan-grid">
        {/* Left Form: Details & Itinerary */}
        <section className="staff-section-card staff-plan-form-card">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 800 }}>
            Details
          </h2>

          <TextField
            label="Activity name"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Welcome evening and Discover Craiova"
          />

          {/* Date to Confirm toggle */}
          <Checkbox
            label="Date to confirm (will show 'Date to be confirmed' on calendar)"
            checked={dateToConfirm}
            onChange={(e) => setDateToConfirm(e.target.checked)}
          />

          {!dateToConfirm && (
            <div className="staff-plan-date-row">
              <TextField
                label="Date"
                type="date"
                required={!dateToConfirm}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (e.target.value) setMonth(e.target.value.slice(0, 7));
                }}
              />
              <TextField
                label="Starts"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <TextField
                label="Ends"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          )}

          {dateToConfirm && (
            <div style={{ maxWidth: '240px' }}>
              <TextField
                label="Month (YYYY-MM)"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="2026-11"
              />
            </div>
          )}

          <TextField
            label="Place / Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="[Venue] or building/room name"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="summary" style={{ fontSize: '15px', fontWeight: 700 }}>
              Short description for students
            </label>
            <textarea
              id="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What students can expect from this event"
              style={{
                minHeight: '80px',
                padding: '12px 14px',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                fontFamily: 'inherit',
                fontSize: '15px',
                lineHeight: '22px',
                color: 'var(--navy)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Cost Radios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700 }}>Cost for students</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'free', label: 'Free' },
                { value: 'small_fee', label: 'Small fee' },
                { value: 'bring_something', label: 'Bring something to share' }
              ].map((c) => {
                const active = cost === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCost(c.value)}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      borderRadius: '999px',
                      border: active ? '1.5px solid var(--navy)' : '1.5px solid var(--border)',
                      backgroundColor: active ? 'var(--navy)' : 'var(--white)',
                      color: active ? 'var(--white)' : 'var(--navy)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Checkbox
            label="Ask students if they're going (enables RSVP buttons)"
            checked={rsvpEnabled}
            onChange={(e) => setRsvpEnabled(e.target.checked)}
          />

          {/* Itinerary Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Itinerary
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Shown on the public activity page and in student dashboard
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((st, idx) => (
                <div key={idx} className="staff-itinerary-row">
                  <input
                    type="text"
                    aria-label={`Step ${idx + 1} time`}
                    value={st.time}
                    onChange={(e) => handleStepChange(idx, 'time', e.target.value)}
                    placeholder="18:00"
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border)',
                      borderRadius: '8px',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      color: 'var(--navy)'
                    }}
                  />
                  <input
                    type="text"
                    aria-label={`Step ${idx + 1} title`}
                    value={st.title || st.what || ''}
                    onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                    placeholder="What happens at this step"
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      border: '1.5px solid var(--border)',
                      borderRadius: '8px',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      color: 'var(--navy)'
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Remove step"
                    onClick={() => handleRemoveStep(idx)}
                    style={{
                      height: '42px',
                      width: '42px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--white)',
                      color: 'var(--brand-red)',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddStep}
              style={{
                alignSelf: 'flex-start',
                height: '40px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1.5px dashed var(--navy)',
                backgroundColor: 'var(--white)',
                color: 'var(--navy)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              + Add a step
            </button>
          </div>

          {/* Optional Lists: What to Bring & Good to Know */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Additional Information</h3>

            {/* What to bring */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>What to bring</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {whatToBring.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveBring(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-red)' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Student ID, comfortable shoes"
                  value={newBringItem}
                  onChange={(e) => setNewBringItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBring())}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    flex: 1
                  }}
                />
                <Button size="sm" type="button" onClick={handleAddBring}>
                  Add
                </Button>
              </div>
            </div>

            {/* Good to know */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Good to know</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {goodToKnow.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--paper)',
                      fontSize: '13px'
                    }}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveKnow(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-red)' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Event is held in English and Romanian"
                  value={newKnowItem}
                  onChange={(e) => setNewKnowItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKnow())}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    flex: 1
                  }}
                />
                <Button size="sm" type="button" onClick={handleAddKnow}>
                  Add
                </Button>
              </div>
            </div>

            <TextField
              label="Highlight quote / note (optional)"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="e.g. 'A night full of stories, new friends and Craiova warmth.'"
            />

            <TextField
              label="Feedback form link (optional, shown after event ends)"
              value={feedbackUrl}
              onChange={(e) => setFeedbackUrl(e.target.value)}
              placeholder="https://forms.gle/..."
            />
          </div>
        </section>

        {/* Right Sidebar: Calendar Preview & Staff Checklist */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Calendar Preview Card */}
          <section className="staff-section-card">
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Preview on the calendar
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--navy)' }}>
                {title || 'Activity name'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {dateToConfirm
                  ? 'Date to be confirmed'
                  : date
                  ? `${new Date(date).toLocaleDateString('en-GB')}, ${startTime} to ${endTime}`
                  : '[Date TBA]'}
                , {venue || '[Venue]'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--forest)', fontWeight: 600 }}>
                {cost === 'free' ? 'Free' : cost === 'small_fee' ? 'Small fee' : 'Bring something'}
              </span>
            </div>
          </section>

          {/* Event Checklist Section (Staff only, never in student/public views) */}
          <section className="staff-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                Event checklist
              </h2>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--forest)' }}>
                {doneCount} of {checklist.length} done
              </span>
            </div>

            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Everything the team needs to prepare. Only staff see this checklist.
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 4px',
                    borderBottom: '1px solid var(--paper)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleChecklist(idx)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--forest)', cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: '14px',
                      color: item.done ? 'var(--text-muted)' : 'var(--navy)',
                      textDecoration: item.done ? 'line-through' : 'none'
                    }}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-red)',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
              <input
                type="text"
                placeholder="Add an item, e.g. Buy snacks"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklist())}
                style={{
                  flex: 1,
                  height: '42px',
                  padding: '0 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: 0
                }}
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--navy)',
                  color: 'var(--white)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Add item
              </button>
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .staff-plan-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(320px, 1fr);
          gap: 24px;
          align-items: start;
        }
        .staff-plan-date-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .staff-itinerary-row {
          display: grid;
          grid-template-columns: 110px minmax(0, 1fr) 42px;
          gap: 8px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .staff-plan-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .staff-plan-form-card {
            padding: 18px 16px !important;
          }
        }
        @media (max-width: 600px) {
          .staff-plan-date-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .staff-itinerary-row {
            grid-template-columns: 85px minmax(0, 1fr) 38px !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
