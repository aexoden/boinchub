# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Health check endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db

router = APIRouter(prefix="/api/v1/health", tags=["health"])


@router.get("")
async def health_check() -> bool:
    """Health check endpoint.

    Returns:
        bool: Always returns True to indicate the service is running.

    """
    return True


@router.get("/ready")
async def readiness_check(db: Annotated[Session, Depends(get_db)]) -> bool:
    """Readiness check endpoint that verifies database connectivity.

    Args:
        db (Session): The database session.

    Returns:
        bool: Always returns True if the database is connected and ready.

    """
    result = db.exec(select(1))
    result.first()

    return True
