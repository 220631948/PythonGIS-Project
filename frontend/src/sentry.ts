/**
 * Sentry Frontend Integration for Cape Town GeoHub
 *
 * Sprint 4 - Infrastructure Setup: Frontend error tracking and performance monitoring
 *
 * To enable:
 * 1. Install Sentry SDK: npm install @sentry/react
 * 2. Add VITE_SENTRY_DSN to .env file
 * 3. Uncomment the integration code below
 */

import * as Sentry from '@sentry/react'

// Environment configuration
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1)
const release = (import.meta.env.VITE_SENTRY_RELEASE as string) || (import.meta.env.VITE_GIT_SHA as string) || 'local'
const environment = (import.meta.env.MODE as string) || 'development'
const sendDefaultPii = (import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII as string) === 'true'

// Initialize Sentry if DSN is provided
if (dsn) {
  Sentry.init({
    dsn,

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace all API requests
        tracePropagationTargets: ['localhost', /^\//],
      }),

      // Replay sessions for debugging
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),

      // React-specific error boundaries
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate, // 0.1 = 10% of transactions

    // Session Replay (sample rate for sessions without errors)
    replaysSessionSampleRate: 0.1, // 10% of sessions

    // Session Replay (always capture sessions with errors)
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions

    // Release tracking
    release,
    environment,

    // PII handling
    sendDefaultPii,

    // Before send hook for additional scrubbing
    beforeSend(event, hint) {
      // Don't send events in development mode
      if (environment === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
        return null
      }

      // Scrub sensitive data from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/([?&])(token|key|password|secret)=[^&]*/gi, '$1$2=[REDACTED]')
      }

      // Scrub sensitive headers
      if (event.request?.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token']
        sensitiveHeaders.forEach(header => {
          if (event.request?.headers?.[header]) {
            event.request.headers[header] = '[REDACTED]'
          }
        })
      }

      return event
    },

    // Ignore common non-critical errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Network errors (often out of our control)
      'NetworkError',
      'Failed to fetch',
      'Load failed',

      // AbortController (intentional cancellations)
      'AbortError',
      'The user aborted a request',

      // ResizeObserver (benign browser quirk)
      'ResizeObserver loop',
    ],
  })

  console.info(`[Sentry] Initialized for ${environment} (${release})`)
} else {
  console.info('[Sentry] DSN not configured - error tracking disabled')
}

// Helper function to set user context
export function setSentryUser(user: { id: string; email?: string; tenant_id?: number }) {
  if (dsn) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id?.toString(),
    })
  }
}

// Helper function to clear user context (on logout)
export function clearSentryUser() {
  if (dsn) {
    Sentry.setUser(null)
  }
}

// Helper function to add custom context
export function addSentryContext(context: string, data: Record<string, any>) {
  if (dsn) {
    Sentry.setContext(context, data)
  }
}

// Helper function to capture custom message
export function captureSentryMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (dsn) {
    Sentry.captureMessage(message, level)
  }
}

// Helper function to capture custom exception
export function captureSentryException(error: Error, context?: Record<string, any>) {
  if (dsn) {
    if (context) {
      Sentry.captureException(error, { contexts: { custom: context } })
    } else {
      Sentry.captureException(error)
    }
  }
}

// Export Sentry for advanced usage
export { Sentry }

export default {
  setSentryUser,
  clearSentryUser,
  addSentryContext,
  captureSentryMessage,
  captureSentryException,
}
