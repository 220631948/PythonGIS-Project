# Sentry Configuration

import sentry_sdk
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

# Initialize Sentry SDK
sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    traces_sample_rate=1.0,
    send_default_pii=True
)

# Wrap your FastAPI app with Sentry middleware
app = SentryAsgiMiddleware(app)