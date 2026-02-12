"""
CSRF Protection Middleware for FastAPI

Implements Double Submit Cookie pattern for CSRF protection.
Compatible with modern frontend frameworks (React, Vue, etc.)
"""

import secrets
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.datastructures import MutableHeaders


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection using Double Submit Cookie pattern.

    How it works:
    1. Generate CSRF token and set as cookie
    2. Frontend reads cookie and sends token in X-CSRF-Token header
    3. Middleware validates token matches cookie for state-changing requests

    Safe methods (GET, HEAD, OPTIONS, TRACE): No CSRF check required
    Unsafe methods (POST, PUT, PATCH, DELETE): CSRF token required
    """

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
    CSRF_COOKIE_NAME = "csrf_token"
    CSRF_HEADER_NAME = "X-CSRF-Token"
    CSRF_TOKEN_LENGTH = 32

    # Paths that don't require CSRF protection
    EXEMPT_PATHS = [
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/auth/login",      # Initial login doesn't have token yet
        "/api/auth/register",   # Initial registration doesn't have token yet
    ]

    def __init__(self, app, cookie_secure: bool = False, cookie_samesite: str = "lax"):
        """
        Initialize CSRF middleware.

        Args:
            app: FastAPI application
            cookie_secure: Set Secure flag on cookie (HTTPS only)
            cookie_samesite: SameSite attribute ('strict', 'lax', or 'none')
        """
        super().__init__(app)
        self.cookie_secure = cookie_secure
        self.cookie_samesite = cookie_samesite

    def _generate_csrf_token(self) -> str:
        """Generate a secure random CSRF token"""
        return secrets.token_urlsafe(self.CSRF_TOKEN_LENGTH)

    def _is_exempt(self, path: str) -> bool:
        """Check if path is exempt from CSRF protection"""
        return any(path.startswith(exempt) for exempt in self.EXEMPT_PATHS)

    def _get_csrf_token_from_cookie(self, request: Request) -> Optional[str]:
        """Extract CSRF token from cookie"""
        return request.cookies.get(self.CSRF_COOKIE_NAME)

    def _get_csrf_token_from_header(self, request: Request) -> Optional[str]:
        """Extract CSRF token from request header"""
        return request.headers.get(self.CSRF_HEADER_NAME)

    def _set_csrf_cookie(self, response: Response, token: str):
        """Set CSRF token as cookie in response"""
        response.set_cookie(
            key=self.CSRF_COOKIE_NAME,
            value=token,
            httponly=False,  # Must be readable by JavaScript
            secure=self.cookie_secure,
            samesite=self.cookie_samesite,
            max_age=86400,  # 24 hours
        )

    async def dispatch(self, request: Request, call_next):
        """
        Process request and validate CSRF token for unsafe methods.
        """
        # Skip CSRF check for safe methods
        if request.method in self.SAFE_METHODS:
            response = await call_next(request)

            # Set CSRF cookie if not present (for subsequent unsafe requests)
            if not self._get_csrf_token_from_cookie(request):
                csrf_token = self._generate_csrf_token()
                self._set_csrf_cookie(response, csrf_token)

            return response

        # Skip CSRF check for exempt paths
        if self._is_exempt(request.url.path):
            response = await call_next(request)

            # Generate and set CSRF token for next request
            csrf_token = self._generate_csrf_token()
            self._set_csrf_cookie(response, csrf_token)

            return response

        # Validate CSRF token for unsafe methods (POST, PUT, PATCH, DELETE)
        cookie_token = self._get_csrf_token_from_cookie(request)
        header_token = self._get_csrf_token_from_header(request)

        # Check if tokens exist
        if not cookie_token or not header_token:
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "CSRF token missing. Include X-CSRF-Token header with value from csrf_token cookie."
                }
            )

        # Validate tokens match (constant-time comparison)
        if not secrets.compare_digest(cookie_token, header_token):
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token mismatch. Invalid or expired token."}
            )

        # CSRF validation passed - process request
        response = await call_next(request)

        # Rotate CSRF token after successful request (optional security enhancement)
        # new_token = self._generate_csrf_token()
        # self._set_csrf_cookie(response, new_token)

        return response


# Convenience endpoint to get CSRF token
def get_csrf_token_endpoint():
    """
    FastAPI endpoint to get CSRF token.

    Usage in main.py:
        @app.get("/api/csrf-token")
        async def get_csrf_token(request: Request):
            from app.middleware.csrf_protection import get_csrf_token_endpoint
            return get_csrf_token_endpoint()(request)
    """
    def _get_token(request: Request):
        token = request.cookies.get(CSRFProtectionMiddleware.CSRF_COOKIE_NAME)
        if not token:
            token = secrets.token_urlsafe(CSRFProtectionMiddleware.CSRF_TOKEN_LENGTH)

        return {"csrf_token": token}

    return _get_token
