import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[kazuki-console] Unhandled render error', error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        data-testid="app-error-boundary"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f5f5f7',
          color: '#1c1c1e',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            width: '100%',
            borderRadius: 18,
            padding: 24,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Mia Console hit a runtime error</h1>
          <p style={{ margin: '0 0 16px', color: 'rgba(60,60,67,0.72)', lineHeight: 1.5 }}>
            The app stayed loaded so the error can be diagnosed instead of showing a blank screen.
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              margin: 0,
              padding: 14,
              borderRadius: 10,
              background: '#f5f5f7',
              color: '#b00020',
              fontSize: 12,
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      </div>
    );
  }
}
