import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 12px'
            }}>
              Something went wrong
            </h1>

            <p style={{
              color: '#64748b',
              fontSize: '15px',
              lineHeight: '1.6',
              margin: '0 0 24px'
            }}>
              We encountered an unexpected error. This has been logged for our team to investigate.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
              >
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#f1f5f9'}
              >
                Reload Page
              </button>
            </div>

            {/* Error details (collapsible) */}
            {this.state.error && (
              <details style={{
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'left'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Technical Details
                </summary>
                <pre style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#7f1d1d',
                  overflow: 'auto',
                  maxHeight: '150px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>

          <p style={{
            marginTop: '24px',
            fontSize: '13px',
            color: '#94a3b8'
          }}>
            Cape Town GeoHub • Data from official open sources
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
