import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPasswordSchema } from '../../../../shared/schemas/auth.js';
import { Button } from '../../components/Button.jsx';
import { PasswordField } from '../../components/PasswordField.jsx';
import { Checkbox } from '../../components/Checkbox.jsx';
import { Card } from '../../components/Card.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { api } from '../../lib/api.js';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const mode = searchParams.get('mode') || ''; // 'activate' or ''

  const [checking, setChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [tokenType, setTokenType] = useState('reset');
  const [isStaffUser, setIsStaffUser] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();

  const isActivateMode = mode === 'activate' || tokenType === 'activate';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
      consent: false
    }
  });

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsValid(false);
        setChecking(false);
        return;
      }

      try {
        const data = await api.get(`/auth/reset-password/check?token=${encodeURIComponent(token)}`);
        if (data?.valid) {
          setIsValid(true);
          setTokenType(data.type || 'reset');
          setIsStaffUser(!!data.isStaff);
        } else {
          setIsValid(false);
        }
      } catch {
        setIsValid(false);
      } finally {
        setChecking(false);
      }
    }

    checkToken();
  }, [token]);

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
        consent: isActivateMode ? data.consent : undefined
      });
      setIsSuccess(true);
    } catch (err) {
      setServerError(err.message || 'Failed to save password. Please try again.');
    }
  };

  if (checking) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 16px' }}>
        <Card style={{ padding: '36px' }}>
          <Skeleton height="32px" width="200px" style={{ marginBottom: '16px' }} />
          <Skeleton height="20px" style={{ marginBottom: '24px' }} />
          <Skeleton height="44px" style={{ marginBottom: '16px' }} />
          <Skeleton height="44px" />
        </Card>
      </div>
    );
  }

  // Link expired or invalid
  if (!isValid) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 16px' }}>
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
            <AlertCircle size={32} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: 'var(--navy)' }}>
            Link expired
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
            This link has expired or was already used.
          </p>

          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg" fullWidth>
              Ask for a new link
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Screen 20: Password changed success
  if (isSuccess) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 16px' }}>
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
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '16px', color: 'var(--navy)' }}>
            Password changed
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
            You can now sign in with your new password.
          </p>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate(isStaffUser ? '/staff/login' : '/signin')}
          >
            Sign in
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
      <Card style={{ padding: '40px 36px', backgroundColor: 'var(--white)' }}>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Opened from the reset email
        </span>

        <h1 style={{ fontSize: '1.75rem', marginTop: '6px', marginBottom: '12px', color: 'var(--navy)' }}>
          {isActivateMode ? 'Choose your password' : 'Choose a new password'}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '28px' }}>
          {isStaffUser ? 'Use at least 10 characters.' : 'Use at least 8 characters.'}
        </p>

        {serverError && <ErrorAlert message={serverError} style={{ marginBottom: '20px' }} />}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <PasswordField
            label="New password"
            placeholder={isStaffUser ? 'At least 10 characters' : 'At least 8 characters'}
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <PasswordField
            label="Confirm new password"
            placeholder="Type it again"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {isActivateMode && (
            <div style={{ marginTop: '4px' }}>
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
                        to run this community. <span style={{ color: 'var(--red)' }}>*</span> */}\
                        I agree that the International Relations Department may use and retain my information to manage this community.
                      </span>
                    }
                  />
                )}
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText="Saving…"
            style={{ marginTop: '8px' }}
          >
            Save new password
          </Button>
        </form>
      </Card>
    </div>
  );
}
