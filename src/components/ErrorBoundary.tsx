import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { reportError, showUserFeedbackDialog } from '../lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture the error and its context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Report to custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      showUserFeedbackDialog(this.state.eventId);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center style={backgroundColor: '#0f0f1e'} text-white p-4">
          <div className="max-w-lg w-full style={backgroundColor: '#1a1a2e'} rounded-lg shadow-xl border style={borderColor: '#2a2a3e'}">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
                <p className="text-zinc-400">
                  We encountered an unexpected error. Our team has been notified and is working on a fix.
                </p>
              </div>

              {/* Error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 bg-zinc-800/50 rounded-lg p-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-zinc-300 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 text-xs text-zinc-400">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-words">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Reload Page
                  </button>
                </div>

                {/* Feedback button in production */}
                {import.meta.env.PROD && this.state.eventId && (
                  <button
                    onClick={this.handleReportFeedback}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm"
                  >
                    Report Additional Information
                  </button>
                )}

                {/* Home button */}
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-4 py-2 border border-zinc-600 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors text-sm"
                >
                  Go to Homepage
                </button>
              </div>

              {/* Event ID for reference */}
              {this.state.eventId && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-zinc-500">
                    Error ID: {this.state.eventId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Custom hook for manual error reporting
export function useErrorReporting() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    reportError(error, context);
  };

  const reportMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    reportMessage(message, level);
  };

  return { reportError, reportMessage };
}