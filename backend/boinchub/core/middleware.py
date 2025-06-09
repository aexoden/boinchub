# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Middleware for BoincHub."""

import time

from collections import defaultdict, deque
from collections.abc import Callable

from fastapi import Request, status
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce rate limiting on API requests."""

    def __init__(self, app: ASGIApp, endpoints: set[str], calls: int = 10, period: int = 60) -> None:
        """Initialize the rate limiter middleware.

        Args:
            app: The FastAPI application instance.
            calls (int): The number of allowed calls within the period.
            period (int): The time period in seconds for rate limiting.

        """
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients: dict[str, deque[float]] = defaultdict(deque)

        # Endpoints to rate limit
        self.limited_endpoints = endpoints

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and apply rate limiting if necessary.

        Args:
            request: The incoming HTTP request.
            call_next: The next middleware or endpoint to call.

        Returns:
            Response: The processed HTTP response.

        """
        if request.url.path not in self.limited_endpoints:
            return await call_next(request)

        # Get client identifier (IP address)
        client_id = request.client.host if request.client else "unknown"

        # Clean old entries
        now = time.time()
        if client_id in self.clients:
            while self.clients[client_id] and self.clients[client_id][0] < now - self.period:
                self.clients[client_id].popleft()

        # Check rate limit
        if len(self.clients[client_id]) >= self.calls:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded. Try again later.",
                    "allowed_calls": self.calls,
                    "reset_after": int(now + self.period),
                },
            )

        # Record this request
        self.clients[client_id].append(now)

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(self.calls - len(self.clients[client_id]))
        response.headers["X-Ratelimit-Reset"] = str(int(now + self.period))

        return response
