import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { forgotPasswordSchema } from '../../../../shared/schemas/auth.js';
import { Button } from '../../components/Button.jsx';
import { TextField } from '../../components/TextField.jsx';
import { Card } from '../../components/Card.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { api } from '../../lib/api.js';

export function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await api.post('/auth/forgot-password', data);
      setIsSent(true);
    } catch (err) {
      if (err.status === 429) {
        setServerError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        // Anti-enumeration: even on unexpected errors, don't leak information
        setIsSent(true);
      }
    }
  };

  // Screen 18: Sent confirmation
  if (isSent) {
    return (
      <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
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
            <MailCheck size={32} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: 'var(--navy)' }}>
            Check your email
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
            If an account exists for this email, a link to choose a new password is on its way.
            It works for 1 hour. Check your spam folder too.
          </p>

          <Link to="/signin" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="lg" fullWidth>
              Back to sign in
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
      <Card style={{ padding: '40px 36px', backgroundColor: 'var(--white)' }}>
        <Link
          to="/signin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            textDecoration: 'none',
            marginBottom: '24px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to sign in</span>
        </Link>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '12px', color: 'var(--navy)' }}>
          Reset your password
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '28px' }}>
          Enter your email and we’ll send you a link to choose a new password.
        </p>

        {serverError && <ErrorAlert message={serverError} style={{ marginBottom: '20px' }} />}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <TextField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText="Sending…"
          >
            Send reset link
          </Button>
        </form>
      </Card>
    </div>
  );
}
