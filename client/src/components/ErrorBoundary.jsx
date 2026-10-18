import React from 'react';
import { Button } from './Button.jsx';
import { StitchBand } from './StitchBand.jsx';
import { Logos } from './Logos.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)' }}>
          <StitchBand />
          <header style={{ padding: '16px 24px', backgroundColor: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
            <Logos />
          </header>
          <main
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 24px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--white)',
                padding: '48px 36px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                maxWidth: '480px',
                width: '100%',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <h1 style={{ fontSize: '1.75rem', marginBottom: '12px', color: 'var(--navy)' }}>
                Something went wrong
              </h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '1rem', lineHeight: 1.5 }}>
                We couldn't load this page. Please try again in a moment.
              </p>
              <Button variant="primary" onClick={this.handleReload} fullWidth size="lg">
                Try again
              </Button>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
