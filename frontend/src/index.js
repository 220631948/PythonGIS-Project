# Sentry Configuration for Frontend

import { init } from '@sentry/react';
import { Integrations } from '@sentry/tracing';

init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [
    new Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});