import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1)
const release = (import.meta.env.VITE_SENTRY_RELEASE as string) || (import.meta.env.VITE_COMMIT_SHA as string) || 'local'
const environment = (import.meta.env.MODE as string) || 'development'
const sendDefaultPii = (import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII as string) === 'true'
const apiUrl = (import.meta.env.VITE_API_URL as string) || ''

if (dsn) {
  Sentry.init({
    dsn,
    integrations: [new BrowserTracing({ tracingOrigins: apiUrl ? [apiUrl, /^\//] : [/^\//] })],
    tracesSampleRate,
    release,
    environment,
    sendDefaultPii,
    // Keep default beforeSend on the frontend minimal; backend performs robust scrubbing
  })

  // Propagate Sentry trace header on outgoing API requests
  try {
    // Delay importing API client to avoid circular imports during early initialization
    setTimeout(async () => {
      const { addRequestInterceptor } = await import('./lib/api')
      addRequestInterceptor((config) => {
        try {
          const span = (Sentry as any).getCurrentHub().getScope()?.getSpan()
          if (span && typeof span.toTraceparent === 'function') {
            const traceparent = span.toTraceparent()
            config.headers = { ...(config.headers || {}), 'sentry-trace': traceparent }
          }
        } catch (_e) {
          // Ignore
        }
        return config
      })
    }, 0)
  } catch (_e) {
    // ignore
  }
}
