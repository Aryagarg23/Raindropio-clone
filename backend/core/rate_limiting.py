"""
Rate limiting middleware for API protection
"""
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from core.logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """
    In-memory rate limiter using sliding window approach
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)
        self.window_size = 60  # seconds

    def is_allowed(self, key: str) -> bool:
        """
        Check if request is allowed for the given key

        Args:
            key: Rate limiting key (e.g., IP address)

        Returns:
            True if request is allowed, False if rate limited
        """
        now = time.time()

        # Clean old requests outside the window
        self.requests[key] = [req_time for req_time in self.requests[key]
                             if now - req_time < self.window_size]

        # Check if under limit
        if len(self.requests[key]) < self.requests_per_minute:
            self.requests[key].append(now)
            return True

        return False

    def get_remaining_requests(self, key: str) -> int:
        """
        Get remaining requests allowed for the key

        Args:
            key: Rate limiting key

        Returns:
            Number of remaining requests
        """
        now = time.time()
        self.requests[key] = [req_time for req_time in self.requests[key]
                             if now - req_time < self.window_size]
        return max(0, self.requests_per_minute - len(self.requests[key]))

    def get_reset_time(self, key: str) -> float:
        """
        Get time until rate limit resets

        Args:
            key: Rate limiting key

        Returns:
            Seconds until reset
        """
        if not self.requests[key]:
            return 0

        now = time.time()
        oldest_request = min(self.requests[key])
        return max(0, self.window_size - (now - oldest_request))


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting API requests
    """

    def __init__(self, app, requests_per_minute: int = 60, exclude_paths: list = None):
        super().__init__(app)
        self.rate_limiter = RateLimiter(requests_per_minute)
        self.exclude_paths = exclude_paths or ["/health", "/metrics"]

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Use client IP as rate limiting key
        client_ip = self._get_client_ip(request)

        if not self.rate_limiter.is_allowed(client_ip):
            reset_time = self.rate_limiter.get_reset_time(client_ip)
            logger.warning("Rate limit exceeded",
                         client_ip=client_ip,
                         path=request.url.path,
                         reset_in_seconds=round(reset_time))

            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {round(reset_time)} seconds.",
                headers={"Retry-After": str(round(reset_time))}
            )

        # Add rate limit headers to response
        response = await call_next(request)

        if isinstance(response, Response):
            remaining = self.rate_limiter.get_remaining_requests(client_ip)
            reset_time = self.rate_limiter.get_reset_time(client_ip)

            response.headers["X-RateLimit-Limit"] = str(self.rate_limiter.requests_per_minute)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(round(time.time() + reset_time))

        return response

    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP address from request

        Args:
            request: FastAPI request object

        Returns:
            Client IP address
        """
        # Check for forwarded headers (when behind proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in case of multiple
            return forwarded_for.split(",")[0].strip()

        # Check for other proxy headers
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fallback to direct client IP
        client_host = getattr(request.client, 'host', 'unknown') if request.client else 'unknown'
        return client_host