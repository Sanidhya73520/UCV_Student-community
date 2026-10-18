import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CheckCircle2, ArrowRight } from 'lucide-react';
import { signUpSchema } from '../../../../shared/schemas/auth.js';
import { COUNTRIES } from '../../../../shared/countries.js';
import { UCV_FACULTIES, STUDENT_PROGRAMME_OPTIONS } from '../../../../shared/faculties.js';
import { Button } from '../../components/Button.jsx';
import { TextField } from '../../components/TextField.jsx';
import { PasswordField } from '../../components/PasswordField.jsx';
import { Combobox } from '../../components/Combobox.jsx';
import { Checkbox } from '../../components/Checkbox.jsx';
import { Card } from '../../components/Card.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { api } from '../../lib/api.js';

export function SignUpPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      mobile: '',
      country: '',
      faculty: '',
      programme: 'erasmus_exchange',
      consent: false
    }
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await api.post('/auth/signup', data);
      setIsSuccess(true);
    } catch (err) {
      if (err.status === 429) {
        setServerError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setServerError(err.message || 'We couldn’t send your request. Please check your connection and try again.');
      }
    }
  };

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name
  }));

  // Success screen (Screen 11)
  if (isSuccess) {
    return (
      <div style={{ maxWidth: '580px', margin: '40px auto', padding: '0 16px' }}>
        <Card style={{ padding: '48px 36px', textAlign: 'center', backgroundColor: 'var(--white)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#E6F4EA',
              color: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: 'var(--navy)' }}>
            Request submitted
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Your registration request has been submitted successfully and is pending administrator approval.
            You will receive an email notification once your account is approved.
          </p>

          <Button variant="primary" size="lg" onClick={() => navigate('/')} fullWidth>
            Back to the website
          </Button>
        </Card>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        maxWidth: '960px',
        margin: '0 auto',
        width: '100%'
      }}
      className="signup-container"
    >
      {/* Left Navy Card */}
      <div
        className="signup-info-card"
        style={{
          flex: '1 1 360px',
          backgroundColor: 'var(--navy)',
          color: 'var(--white)',
          padding: '40px 32px',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '480px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--marigold)', fontWeight: 700, letterSpacing: '0.5px' }}>
            WELCOME TO UCV
          </span>
          <h2 style={{ fontSize: '2rem', color: 'var(--white)', marginTop: '8px', marginBottom: '16px', lineHeight: 1.2 }}>
            Join the community
          </h2>
          <p style={{ color: '#C3C9D6', fontSize: '1rem', lineHeight: 1.5, marginBottom: '32px' }}>
            Create your account once. The International Relations Department checks every request, then you can sign in.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Join activities and say you’re going',
              'Ask the coordinator anything',
              'Post on the International Wall',
              'Add your country to our map'
            ].map((text) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(242, 183, 5, 0.2)',
                    color: 'var(--marigold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '0.95rem', color: 'var(--white)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '40px', fontSize: '0.85rem', color: '#A0AEC0' }}>
          Official platform of the International Relations Department, University of Craiova.
        </div>
      </div>

      {/* Right White Card (Form) */}
      <div
        className="signup-form-card"
        style={{
          flex: '1 1 480px',
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Tab switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div
            className="signup-tabs-container"
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--paper)',
              padding: '4px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border)'
            }}
          >
            <Link
              to="/signin"
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textDecoration: 'none'
              }}
            >
              Sign in
            </Link>
            <span
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'var(--navy)',
                color: 'var(--white)'
              }}
            >
              Sign up
            </span>
          </div>

          <Link to="/signin" className="desktop-only" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already registered? <strong style={{ color: 'var(--red)' }}>Sign in</strong>
          </Link>
        </div>

        <h1 style={{ fontSize: '1.65rem', marginBottom: '24px', color: 'var(--navy)' }}>
          Create student account
        </h1>

        {serverError && <ErrorAlert message={serverError} style={{ marginBottom: '20px' }} />}

        {errorCount > 1 && (
          <ErrorAlert
            message={`Please fix the ${errorCount} fields marked in red.`}
            style={{ marginBottom: '20px' }}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
          <TextField
            label="Full name"
            placeholder="Your full name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <TextField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordField
            label="Create password"
            placeholder="At least 8 characters"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordField
            label="Confirm password"
            placeholder="Type it again"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <TextField
            label="Mobile number"
            type="tel"
            placeholder="+34 600 000 000"
            required
            error={errors.mobile?.message}
            {...register('mobile')}
          />

          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Combobox
                label="Country"
                placeholder="Search your country…"
                required
                options={countryOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.country?.message}
              />
            )}
          />

          {/* Faculty / Programme Enrolled Section */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: '12px',
              backgroundColor: '#F8F9FB',
              border: '1.5px solid #E6E9F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginTop: '4px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                University Studies
              </span>
              <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>
                Faculty / Programme enrolled
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Select your designated faculty or centre at the University of Craiova.
              </span>
            </div>

            <Controller
              name="faculty"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="signup-faculty-select" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
                    Faculty / Centre
                  </label>
                  <select
                    id="signup-faculty-select"
                    aria-label="Faculty / programme enrolled"
                    value={field.value || ''}
                    onChange={field.onChange}
                    style={{
                      height: '46px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--white)',
                      fontSize: '13px',
                      color: field.value ? 'var(--navy)' : 'var(--text-muted)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select your faculty / centre…</option>
                    {UCV_FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            />

            <Controller
              name="programme"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="signup-programme-select" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
                    Study Programme
                  </label>
                  <select
                    id="signup-programme-select"
                    aria-label="Study programme"
                    value={field.value || 'erasmus_exchange'}
                    onChange={field.onChange}
                    style={{
                      height: '46px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--border)',
                      backgroundColor: 'var(--white)',
                      fontSize: '13px',
                      color: 'var(--navy)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {STUDENT_PROGRAMME_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <Controller
              name="consent"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  error={errors.consent?.message}
                  label={
                    <span>
                      {/* I agree that the International Relations Department{' '}
                      <Link to="/privacy" target="_blank" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>
                        keeps my details
                      </Link>{' '}
                      to run this community. <span style={{ color: 'var(--red)' }}>*</span> */
                      }
                      I agree that the International Relations Department may use and retain my information to manage this community.
                    </span>
                  }
                />
              )}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText="Sending…"
            style={{ marginTop: '12px' }}
          >
            <span>Sign up</span>
            <ArrowRight size={18} />
          </Button>
        </form>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .signup-info-card {
            display: none !important;
          }
          .signup-container {
            padding: 0 !important;
            gap: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .signup-form-card {
            padding: 24px 18px !important;
            border-radius: 20px !important;
            border: 1px solid var(--border) !important;
            box-shadow: 0 4px 16px rgba(24, 32, 58, 0.04) !important;
            background: var(--white) !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            flex: 1 1 100% !important;
            box-sizing: border-box !important;
          }
          .signup-tabs-container {
            width: 100% !important;
            display: flex !important;
            box-sizing: border-box !important;
          }
          .signup-tabs-container > * {
            flex: 1 !important;
            text-align: center !important;
            padding: 8px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
