"""Sentry initialization and scrubbing helpers for the FastAPI backend."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict

try:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration
except Exception:  # pragma: no cover - optional dependency
    sentry_sdk = None
    LoggingIntegration = None
    SqlalchemyIntegration = None
    StarletteIntegration = None

from app.config import settings

logger = logging.getLogger(__name__)

_SCRUBBED_HEADERS = {"authorization", "cookie"}


def _sanitize_coords(value: Any) -> Any:
    """Round coordinate sequences to 4 decimals to avoid leaking precision."""
    try:
        if isinstance(value, (list, tuple)):
            return [round(float(x), 4) for x in value]
    except Exception:
        # If anything goes wrong, return the original value untouched
        return value
    return value


def before_send(event: Dict[str, Any], hint: Any) -> Dict[str, Any]:
    """Scrub PII and high-precision coords before sending to Sentry."""
    try:
        request = event.get("request") or {}
        headers = request.get("headers") or {}
        sanitized_headers = {
            k: v for k, v in headers.items() if k.lower() not in _SCRUBBED_HEADERS
        }
        if sanitized_headers:
            request["headers"] = sanitized_headers
        event["request"] = request

        extra = event.get("extra") or {}
        for key in ("bbox", "centroid"):
            if key in extra:
                extra[key] = _sanitize_coords(extra[key])
        event["extra"] = extra
    except Exception as exc:  # pragma: no cover - defensive
        logger.debug("sentry before_send scrub failed: %s", exc)
    return event


def init_sentry() -> None:
    """Initialize Sentry if a DSN is configured and the SDK is available."""
    dsn = settings.SENTRY_DSN
    if not dsn:
        logger.info("Sentry DSN not configured; skipping Sentry initialization.")
        return

    if not sentry_sdk:
        logger.warning("sentry-sdk not installed; skipping Sentry initialization.")
        return

    release = settings.SENTRY_RELEASE or os.getenv("GIT_SHA") or None

    integrations = []
    if StarletteIntegration:
        integrations.append(StarletteIntegration(transaction_style="url"))
    if LoggingIntegration:
        integrations.append(LoggingIntegration(level=logging.INFO, event_level=logging.ERROR))
    if SqlalchemyIntegration:
        integrations.append(SqlalchemyIntegration())

    sentry_sdk.init(
        dsn=dsn,
        environment=settings.SENTRY_ENVIRONMENT,
        release=release,
        send_default_pii=settings.SENTRY_SEND_DEFAULT_PII,
        traces_sample_rate=float(settings.SENTRY_TRACES_SAMPLE_RATE),
        before_send=before_send,
        integrations=integrations,
    )

    logger.info(
        "Sentry initialized for environment=%s release=%s",
        settings.SENTRY_ENVIRONMENT,
        release,
    )
