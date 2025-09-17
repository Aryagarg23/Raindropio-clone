"""
Security headers middleware for API protection
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from core.logging import get_logger

logger = get_logger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Only add security headers to successful responses
        if isinstance(response, Response) and 200 <= response.status_code < 300:
            # HTTPS and security headers
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

            # Content Security Policy (restrictive but allows necessary resources)
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Allow inline scripts for admin panel
                "style-src 'self' 'unsafe-inline'; "  # Allow inline styles
                "img-src 'self' data: https:; "  # Allow images from HTTPS and data URLs
                "font-src 'self' data:; "  # Allow fonts
                "connect-src 'self' https://*.supabase.co; "  # Allow connections to Supabase
                "frame-ancestors 'none';"  # Prevent framing
            )
            response.headers["Content-Security-Policy"] = csp

            # Permissions Policy (restrict features)
            permissions = (
                "camera=(), "
                "microphone=(), "
                "geolocation=(), "
                "gyroscope=(), "
                "magnetometer=(), "
                "payment=(), "
                "usb=()"
            )
            response.headers["Permissions-Policy"] = permissions

            # Remove server header for security
            if "Server" in response.headers:
                del response.headers["Server"]

        return response