import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Hourglass, XCircle, ArrowRight } from 'lucide-react';
import { signInSchema } from '../../../../shared/schemas/auth.js';
import { Button } from '../../components/Button.jsx';
import { TextField } from '../../components/TextField.jsx';
import { PasswordField } from '../../components/PasswordField.jsx';
import { Card } from '../../components/Card.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, setAuthToken } from '../../lib/api.js';

export function SignInPage() {
  const [authStatus, setAuthStatus] = useState('idle'); // 'idle' | 'pending' | 'rejected'
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setErrorMessage(null);
    try {
      const res = await api.post('/auth/signin', data);
      if (res?.token) {
        setAuthToken(res.token);
      }
      await refreshUser();
      // Redirect staff/admin to /staff, student to /student
      if (res?.user?.role === 'admin' || res?.user?.role === 'staff') {
        if (res?.user?.mustChangePassword) {
          navigate('/staff/set-password', { replace: true });
        } else {
          navigate('/staff', { replace: true });
        }
      } else {
        const target = location.state?.from?.pathname || '/student';
        navigate(target, { replace: true });
      }
    } catch (err) {
      if (err.code === 'PENDING_APPROVAL') {
        setAuthStatus('pending');
      } else if (err.code === 'REQUEST_REJECTED') {
        setAuthStatus('rejected');
      } else if (err.status === 429) {
        setErrorMessage('Too many attempts. Please wait a few minutes and try again.');
        setValue('password', '');
      } else {
        // Universal message for invalid credentials
        setErrorMessage('Email or password is not correct. Please try again.');
        setValue('password', '');
      }
    }
  };

  // Screen 14: Pending approval
  if (authStatus === 'pending') {
    return (
      <div style={{ maxWidth: '540px', margin: '40px auto', padding: '0 16px' }}>
        <Card style={{ padding: '48px 36px', textAlign: 'center', backgroundColor: 'var(--white)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF3D6',
              color: 'var(--marigold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}
          >
            <Hourglass size={32} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: 'var(--navy)' }}>
            Pending approval
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
            Your account is waiting for approval from the International Relations Department.
            We’ll email you as soon as you can sign in.
          </p>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => {
              setAuthStatus('idle');
              setErrorMessage(null);
            }}
          >
            Back to sign in
          </Button>
        </Card>
      </div>
    );
  }

  // Screen 15: Request not approved
  if (authStatus === 'rejected') {
    return (
      <div style={{ maxWidth: '540px', margin: '40px auto', padding: '0 16px' }}>
        <Card style={{ padding: '48px 36px', textAlign: 'center', backgroundColor: 'var(--white)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--pink-tint)',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}
          >
            <XCircle size={32} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: 'var(--navy)' }}>
            Request not approved
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
            The International Relations Department couldn’t approve this account. If you think this is a mistake, contact the department at{' '}
            <a href="mailto:international@ucv.ro" style={{ color: 'var(--red)', textDecoration: 'underline' }}>
              international@ucv.ro
            </a>.
          </p>

          <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/')}>
            Back to the website
          </Button>
        </Card>
      </div>
    );
  }

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
      className="signin-container"
    >
      {/* Left Navy Card */}
      <div
        className="signin-info-card"
        style={{
          flex: '1 1 360px',
          backgroundColor: 'var(--navy)',
          color: 'var(--white)',
          padding: '40px 32px',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '440px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--marigold)', fontWeight: 700, letterSpacing: '0.5px' }}>
            YOUR STUDENT PORTAL
          </span>
          <h2 style={{ fontSize: '2rem', color: 'var(--white)', marginTop: '8px', marginBottom: '16px', lineHeight: 1.2 }}>
            Welcome back
          </h2>
          <p style={{ color: '#C3C9D6', fontSize: '1rem', lineHeight: 1.5, marginBottom: '32px' }}>
            Sign in with the email and password you chose when you signed up.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'See activities and itineraries',
              'Your questions and answers',
              'Your posts and words',
              'Your ambassador application'
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
          University of Craiova • International Relations Department
        </div>
      </div>

      {/* Right White Card (Form) */}
      <div
        className="signin-form-card"
        style={{
          flex: '1 1 480px',
          backgroundColor: 'var(--white)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '40px 36px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Tab Switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div
            className="signin-tabs-container"
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--paper)',
              padding: '4px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border)'
            }}
          >
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
              Sign in
            </span>
            <Link
              to="/signup"
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textDecoration: 'none'
              }}
            >
              Sign up
            </Link>
          </div>

          <Link to="/signup" className="desktop-only" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            New here? <strong style={{ color: 'var(--red)' }}>Sign up</strong>
          </Link>
        </div>

        <h1 style={{ fontSize: '1.65rem', marginBottom: '24px', color: 'var(--navy)' }}>
          Sign in to your account
        </h1>

        {errorMessage && <ErrorAlert message={errorMessage} style={{ marginBottom: '24px' }} />}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <TextField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordField
            label="Password"
            placeholder="Your password"
            required
            error={errors.password?.message}
            rightElement={
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--red)',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Forgot password?
              </Link>
            }
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText="Signing in…"
            style={{ marginTop: '8px' }}
          >
            <span>Sign in</span>
            <ArrowRight size={18} />
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Staff or administrator?{' '}
            <Link to="/staff/login" style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>
              Staff login →
            </Link>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .signin-info-card {
            display: none !important;
          }
          .signin-container {
            padding: 0 !important;
            gap: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .signin-form-card {
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
          .signin-tabs-container {
            width: 100% !important;
            display: flex !important;
            box-sizing: border-box !important;
          }
          .signin-tabs-container > * {
            flex: 1 !important;
            text-align: center !important;
            padding: 8px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
