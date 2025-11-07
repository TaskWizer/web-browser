import * as Sentry from '@sentry/react';

// Sentry configuration for error tracking and performance monitoring
export function initSentry() {
  // Only initialize in production or when explicitly enabled
  const isProduction = import.meta.env.PROD;
  const isSentryEnabled = import.meta.env.VITE_SENTRY_DSN || import.meta.env.SENTRY_DSN;

  if (!isProduction && !isSentryEnabled) {
    console.log('Sentry: Disabled in development (no DSN provided)');
    return;
  }

  const dsn = isSentryEnabled || '';

  Sentry.init({
    dsn,
    integrations: [
      // Performance monitoring
      Sentry.browserTracingIntegration(),
      // Session replay for error debugging
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      // Capture console errors
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],

    // Set traces sample rate to 1.0 to capture 100% of transactions for performance monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // Lower sample rate in production

    // Set sampling rate for session replay
    replaysSessionSampleRate: isProduction ? 0.05 : 0.1, // 5% in production, 10% in development
    replaysOnErrorSampleRate: 1.0, // 100% when errors occur

    // Environment configuration
    environment: import.meta.env.MODE || 'development',

    // Release version for better error tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Before sending events, add additional context
    beforeSend(event) {
      // Filter out certain errors in development
      if (!isProduction) {
        // Don't send network errors in development
        if (event.exception?.values?.[0]?.type === 'TypeError' &&
            event.message?.includes('NetworkError')) {
          return null;
        }
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'TaskWizer Web Browser',
          version: import.meta.env.VITE_APP_VERSION || '1.0.0',
          buildMode: import.meta.env.VITE_BUILD_MODE || 'spa',
        },
        browser: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        },
      };

      return event;
    },

    // Error filtering
    ignoreErrors: [
      // Ignore common browser extension errors
      /^Non-Error promise rejection captured/,
      /^ResizeObserver loop limit exceeded/,
      /^Script error\./,
      // Ignore specific network errors that are expected
      /^Failed to fetch/,
      /^Network request failed/,
    ],

    // URL filtering
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      // Third-party scripts that we don't control
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
      /googlesyndication\.com/i,
    ],
  });

  console.log('Sentry: Initialized successfully');
}

// Custom error reporting functions
export const reportError = (error: Error, context?: Record<string, any>) => {
  console.error('Application Error:', error);

  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

export const reportMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Performance monitoring
export const startTransaction = (name: string) => {
  return Sentry.startTransaction({
    name,
    op: 'navigation',
  });
};

// User feedback for errors
export const showUserFeedbackDialog = (eventId: string) => {
  Sentry.showReportDialog({
    eventId,
    title: 'Something went wrong',
    subtitle: 'Our team has been notified. If you\'d like to help, please tell us what happened below.',
    submitLabel: 'Send Feedback',
    labelName: 'Name',
    labelEmail: 'Email',
    labelComments: 'What happened?',
    labelClose: 'Close',
    labelSubmit: 'Submit',
    successMessage: 'Thank you for your feedback!',
  });
};

// Error boundary wrapper component
export const withSentryErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: fallback || (({ error, reset }) => (
      <div className="min-h-screen flex items-center justify-center bg-browser-bg text-white p-4">
        <div className="max-w-md w-full bg-browser-surface rounded-lg shadow-xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-zinc-400 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-browser-bg hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )),
  });
};