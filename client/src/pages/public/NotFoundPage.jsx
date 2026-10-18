import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';

export function NotFoundPage() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center'
      }}
    >
      <Card style={{ maxWidth: '480px', width: '100%', padding: '48px 36px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--navy)' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '32px' }}>
          This page doesn't exist or has moved.
        </p>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="lg" fullWidth>
            Go to the home page
          </Button>
        </Link>
      </Card>
    </div>
  );
}
