# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Public API."""

import logging

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from boinchub.__about__ import __version__
from boinchub.api.endpoints import (
    auth,
    boinc,
    computers,
    config,
    health,
    project_attachments,
    projects,
    user_project_keys,
    users,
)
from boinchub.core.middleware import RateLimitMiddleware
from boinchub.core.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, Any]:  # noqa: RUF029
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

    yield


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
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(auth.router)
    app.include_router(boinc.router)
    app.include_router(computers.router)
    app.include_router(config.router)
    app.include_router(health.router)
    app.include_router(project_attachments.router)
    app.include_router(projects.router)
    app.include_router(user_project_keys.router)
    app.include_router(users.router)

    return app


def main() -> None:
    """Run the application."""
    app = _create_app()

    uvicorn.run(app, host=settings.host, port=settings.port, log_level="info")
