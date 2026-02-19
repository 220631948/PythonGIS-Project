# Sentry Configuration for Cape Town GeoHub

_Last updated: 2026-02-19_

## Installation

1. **Install Sentry SDK** for Python and JavaScript:
   ```bash
   # Backend
   pip install --upgrade sentry-sdk
   
   # Frontend
   npm install @sentry/react @sentry/tracing
   ```

## Backend Configuration (FastAPI)

In your `app/main.py`, initialize Sentry:
```python
import sentry_sdk
from fastapi import FastAPI

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    traces_sample_rate=1.0,
    # Adjust this value in production
)

app = FastAPI()
```

## Frontend Configuration (React)

In your `src/index.jsx`, initialize Sentry:
```javascript
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [
    new Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 1.0, // Adjust this value in production
});
```

## Performance Tracing

To enable performance tracing, ensure you have the following in both backend and frontend configurations:
- Set `traces_sample_rate` to a value between 0 and 1 (e.g., `0.5` for 50% of transactions).

## Geospatial Error Telemetry Tagging

You can add custom tags to your errors to track geospatial issues:
```python
# In your FastAPI route
@router.get('/some-endpoint')
async def some_endpoint():
    try:
        # Your logic here
    except Exception as e:
        sentry_sdk.capture_exception(e)
        sentry_sdk.set_context('geospatial_data', {
            'lat': latitude,
            'lng': longitude,
        })
        raise
```

## Deployment

Ensure your environment variables are set in your deployment environment to include `SENTRY_DSN`.

## Testing Sentry Integration

1. Trigger an error in your application to verify Sentry captures it.
2. Check your Sentry dashboard for the reported error.

## Documentation

Refer to the official Sentry documentation for more details on advanced configurations and usage: [Sentry Documentation](https://docs.sentry.io/platforms/python/guides/fastapi/) and [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/).