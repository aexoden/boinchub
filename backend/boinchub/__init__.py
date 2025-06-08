# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Public API."""

import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from boinchub.__about__ import __version__
from boinchub.api.endpoints import auth, boinc, computers, project_attachments, projects, users
from boinchub.core.settings import settings


def _create_app() -> FastAPI:
    app = FastAPI(
        title="BoincHub",
        summary="A BOINC account manager intended for personal use.",
        version=__version__,
    )

    app.include_router(computers.router)
    app.include_router(auth.router)
    app.include_router(boinc.router)
    app.include_router(project_attachments.router)
    app.include_router(projects.router)
    app.include_router(users.router)

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

    return app


def main() -> None:
    """Run the application."""
    app = _create_app()

    uvicorn.run(app, host=settings.host, port=settings.port, log_level="info")
