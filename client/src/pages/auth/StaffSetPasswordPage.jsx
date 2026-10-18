import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffSetPasswordSchema } from '../../../../shared/schemas/auth.js';
import { Button } from '../../components/Button.jsx';
import { PasswordField } from '../../components/PasswordField.jsx';
import { Card } from '../../components/Card.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';

export function StaffSetPasswordPage() {
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(staffSetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const currentPassword = watch('password', '');
  const charsNeeded = Math.max(0, 10 - currentPassword.length);

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await api.post('/auth/staff/set-password', data);
      await refreshUser();
      navigate('/staff', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Failed to save password. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
      <Card style={{ padding: '44px 36px', backgroundColor: 'var(--white)' }}>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--marigold)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          First sign-in
        </span>

        <h1 style={{ fontSize: '1.75rem', marginTop: '6px', marginBottom: '8px', color: 'var(--navy)' }}>
          Set your own password
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '28px' }}>
          Your temporary password stops working once you set a new one.
        </p>

        {serverError && <ErrorAlert message={serverError} style={{ marginBottom: '20px' }} />}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <div>
            <PasswordField
              label="New password"
              placeholder="At least 10 characters"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            <div style={{ marginTop: '6px', fontSize: '0.825rem', color: charsNeeded > 0 ? 'var(--text-muted)' : 'var(--green)' }}>
              {charsNeeded > 0 ? `${charsNeeded} more characters needed` : 'Looks good ✓'}
            </div>
          </div>

          <PasswordField
            label="Confirm new password"
            placeholder="Type it again"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText="Saving…"
            style={{ marginTop: '8px' }}
          >
            Save and continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
