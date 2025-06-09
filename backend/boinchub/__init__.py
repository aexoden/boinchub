# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Public API."""

import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from boinchub.__about__ import __version__
from boinchub.api.endpoints import auth, boinc, computers, health, project_attachments, projects, users
from boinchub.core.middleware import RateLimitMiddleware
from boinchub.core.settings import settings


def _create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        FastAPI: The configured FastAPI application instance.

    """
    app = FastAPI(
        title="BoincHub",
        summary="A BOINC account manager intended for personal use.",
        version=__version__,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    # Add rate limiting middleware
    app.add_middleware(
        RateLimitMiddleware,
        endpoints={
            "/api/v1/auth/login",
            "/api/v1/users/register",
            "/boinc/rpc.php",
        },
        calls=10,
        period=60,
    )

    # Add CORS middleware
    origins = [
        f"http://{settings.host}:{settings.port}",
        f"http://{settings.host}:{settings.port + 1}",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(auth.router)
    app.include_router(boinc.router)
    app.include_router(computers.router)
    app.include_router(health.router)
    app.include_router(project_attachments.router)
    app.include_router(projects.router)
    app.include_router(users.router)

    return app


def main() -> None:
    """Run the application."""
    app = _create_app()

    uvicorn.run(app, host=settings.host, port=settings.port, log_level="info")
