import logging
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from app.config import settings

logger = logging.getLogger(__name__)

# --- Admin API Key Authentication ---
_api_key_header = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)


def require_admin_key(api_key: str = Security(_api_key_header)) -> str:
    """FastAPI dependency that enforces admin API key on protected endpoints.

    If ADMIN_API_KEY is not configured (empty string), access is unrestricted
    and a warning is logged on first call.
    """
    expected = settings.ADMIN_API_KEY
    if not expected:
        # No key configured — allow access but warn
        logger.warning(
            "ADMIN_API_KEY not set — admin endpoints are unprotected. "
            "Set ADMIN_API_KEY in .env for production."
        )
        return "unprotected"
    if not api_key or api_key != expected:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing admin API key (X-Admin-API-Key header).",
        )
    return api_key


def get_settings():
    return settings

# Add more dependencies as needed (e.g., database session, cache manager)
