# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Public API."""

import logging

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import uvicorn

from fastapi import FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from boinchub.__about__ import __version__
from boinchub.api.endpoints import (
    auth,
    boinc,
    computers,
    config,
    health,
    invite_codes,
    preference_groups,
    project_attachments,
    projects,
    user_project_keys,
    users,
)
from boinchub.core.middleware import RateLimitMiddleware
from boinchub.core.settings import settings
from boinchub.tasks.user_session import SessionCleanupTask

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, Any]:
    """Lifespan context manager for the FastAPI application.

    Yields:
        None: This context manager does not yield any value, but is used to perform startup tasks.

    Raises:
        ValueError: If configuration is invalid.

    """
    logger = logging.getLogger(__name__)
    logger.info("Starting BoincHub v%s", __version__)
    logger.info("Server: %s:%s", settings.host, settings.port)

    # Validate critical settings
    try:
        if not settings.secret_key:
            logger.error("SECRET_KEY not configured!")
    except ValueError:
        logger.exception("Configuration error")
        raise

    # Initialize session cleanup task
    session_cleanup_task = SessionCleanupTask()
    session_cleanup_task.start_background_task()

    yield

    logger.info("Shutting down BoincHub v%s", __version__)
    await session_cleanup_task.stop()


def _create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        FastAPI: The configured FastAPI application instance.

    """
    app = FastAPI(
        title="BoincHub",
        summary="A BOINC account manager intended for personal use.",
        version=__version__,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    # Add rate limiting middleware
    app.add_middleware(
        RateLimitMiddleware,
        endpoints={
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/users/register",
            "/boinc/rpc.php",
        },
        calls=10,
        period=60,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.backend_url,
            settings.frontend_url,
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
        expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    )

    # Include routers
    app.include_router(auth.router)
    app.include_router(boinc.router)
    app.include_router(computers.router)
    app.include_router(config.router)
    app.include_router(health.router)
    app.include_router(invite_codes.router)
    app.include_router(preference_groups.router)
    app.include_router(project_attachments.router)
    app.include_router(projects.router)
    app.include_router(user_project_keys.router)
    app.include_router(users.router)

    # Serve static files in production
    static_dir = Path(__file__).parent.parent / "static"

    if static_dir.exists():
        logger = logging.getLogger(__name__)
        logger.info("Serving static files from %s", static_dir)
        app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str) -> FileResponse:
            """Serve the SPA index file for any unmatched paths.

            Args:
                full_path (str): The requested path.

            Returns:
                FileResponse: The index.html file for SPA routing.

            Raises:
                HTTPException: If the path starts with "api/" or "boinc/", returns 404 Not Found.

            """
            if full_path.startswith(("api/", "boinc/")):
                raise HTTPException(status_code=404, detail="Not Found")

            return FileResponse(static_dir / "index.html")

    return app


def main() -> None:
    """Run the application."""
    app = _create_app()

    uvicorn.run(app, host=settings.host, port=settings.port, log_level="info")
