import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { signInSchema } from '../../../../shared/schemas/auth.js';
import { Button } from '../../components/Button.jsx';
import { TextField } from '../../components/TextField.jsx';
import { PasswordField } from '../../components/PasswordField.jsx';
import { Card } from '../../components/Card.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, setAuthToken } from '../../lib/api.js';

export function StaffLoginPage() {
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setErrorMessage(null);
    try {
      const res = await api.post('/auth/staff-login', data);
            if (res?.token) {
        setAuthToken(res.token);
      }
      await refreshUser();
      if (res?.user?.role === 'student') {
        navigate('/student', { replace: true });
      } else if (res?.user?.mustChangePassword) {
        navigate('/staff/set-password', { replace: true });
      } else {
        navigate('/staff', { replace: true });
      }
    } catch (err) {
      if (err.code === 'PENDING_APPROVAL') {
        setErrorMessage('Your student account is waiting for approval from the International Relations Department.');
      } else if (err.code === 'REQUEST_REJECTED') {
        setErrorMessage('The International Relations Department could not approve this account.');
      } else {
        setErrorMessage('Email or password is not correct. Please try again.');
        setValue('password', '');
      }
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
      <Card style={{ padding: '44px 36px', backgroundColor: 'var(--white)' }}>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--red)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Staff login
        </span>

        <h1 style={{ fontSize: '1.75rem', marginTop: '6px', marginBottom: '8px', color: 'var(--navy)' }}>
          International Relations team
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '28px' }}>
          Only invited staff can sign in. Use the email and password from your invitation.
        </p>

        {errorMessage && <ErrorAlert message={errorMessage} style={{ marginBottom: '20px' }} />}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <TextField
            label="Email address"
            type="email"
            placeholder="name@ucv.ro"
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
            variant="navy"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText="Signing in…"
            style={{ marginTop: '8px' }}
          >
            <span>Sign in</span>
            <ArrowRight size={18} />
          </Button>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Link to="/signin" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Student? <strong style={{ color: 'var(--red)' }}>Student sign in</strong>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
