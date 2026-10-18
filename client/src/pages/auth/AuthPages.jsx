import React from 'react';
import { Card } from '../../components/Card.jsx';

export function SignUpPage() {
  return (
    <Card>
      <h1>Join the community</h1>
      <p style={{ color: 'var(--text-muted)' }}>Create your account once.</p>
    </Card>
  );
}

export function SignInPage() {
  return (
    <Card>
      <h1>Welcome back</h1>
      <p style={{ color: 'var(--text-muted)' }}>Sign in with your email and password.</p>
    </Card>
  );
}

export function ForgotPasswordPage() {
  return (
    <Card>
      <h1>Reset your password</h1>
      <p style={{ color: 'var(--text-muted)' }}>Enter your email and we'll send you a link to choose a new password.</p>
    </Card>
  );
}

export function ResetPasswordPage() {
  return (
    <Card>
      <h1>Choose a new password</h1>
    </Card>
  );
}

export function StaffLoginPage() {
  return (
    <Card>
      <h1>International Relations team</h1>
      <p style={{ color: 'var(--text-muted)' }}>Only invited staff can sign in.</p>
    </Card>
  );
}

export function StaffSetPasswordPage() {
  return (
    <Card>
      <h1>Set your own password</h1>
      <p style={{ color: 'var(--text-muted)' }}>Your temporary password stops working once you set a new one.</p>
    </Card>
  );
}
