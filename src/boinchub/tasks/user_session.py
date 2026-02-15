# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Background task for cleaning up expired sessions."""

import asyncio
import logging

from contextlib import suppress

from sqlmodel import Session, col, func, select

from boinchub.core.database import engine
from boinchub.core.settings import settings
from boinchub.models.user_session import UserSession
from boinchub.services.session_service import get_session_service

logger = logging.getLogger(__name__)


def cleanup_expired_sessions() -> None:
    """Clean up expired sessions from the database."""
    with Session(engine) as db:
        session_service = get_session_service(db)
        cleaned_count = session_service.cleanup_expired_sessions()

        if cleaned_count > 0:
            logger.info("Cleaned up %d expired sessions.", cleaned_count)


def cleanup_inactive_sessions() -> None:
    """Clean up inactive sessions from the database."""
    with Session(engine) as db:
        session_service = get_session_service(db)
        cleaned_count = session_service.cleanup_inactive_sessions(settings.inactive_session_retention_days)

        if cleaned_count > 0:
            logger.info(
                "Cleaned up %d inactive sessions older than %d days.",
                cleaned_count,
                settings.inactive_session_retention_days,
            )


def cleanup_old_sessions_by_user_limit() -> None:
    """Clean up old sessions that exceed the per-user limit."""
    with Session(engine) as db:
        subquery = (
            select(UserSession.user_id, func.count(col(UserSession.id)).label("session_count"))
            .where(UserSession.is_active == True)  # noqa: E712
            .group_by(col(UserSession.user_id))
            .having(func.count(col(UserSession.id)) > settings.max_sessions_per_user)
        ).subquery()

        target_users = list(db.exec(select(subquery.c.user_id)).all())

        total_cleaned = 0

        for user_id in target_users:
            user_sessions = list(
                db.exec(
                    select(UserSession)
                    .where(UserSession.user_id == user_id, UserSession.is_active == True)  # noqa: E712
                    .order_by(col(UserSession.last_accessed_at).asc())
                ).all()
            )

            sessions_to_deactivate = len(user_sessions) - settings.max_sessions_per_user

            for session in user_sessions[:sessions_to_deactivate]:
                session.is_active = False
                db.add(session)
                total_cleaned += 1

        if total_cleaned > 0:
            db.commit()
            logger.info(
                "Cleaned up %d old sessions across %d users exceeding the limit of %d sessions per user.",
                total_cleaned,
                len(target_users),
                settings.max_sessions_per_user,
            )


def run_cleanup_cycle() -> None:
    """Run a complete cleanup cycle."""
    logger.info("Starting session cleanup cycle")

    cleanup_old_sessions_by_user_limit()
    cleanup_expired_sessions()
    cleanup_inactive_sessions()

    logger.info("Session cleanup cycle completed")


class SessionCleanupTask:
    """Background task for cleaning up expired sessions."""

    def __init__(self) -> None:
        """Initialize the session cleanup task."""
        self.running = False
        self.task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        """Start the background cleanup task."""
        if self.running:
            return

        self.running = True
        logger.info("Starting session cleanup task (interval: %d hours)", settings.session_cleanup_interval_hours)

        while self.running:
            try:
                run_cleanup_cycle()
                await asyncio.sleep(settings.session_cleanup_interval_hours * 3600)
            except asyncio.CancelledError:
                logger.info("Session cleanup task cancelled")
                break
            except Exception:
                logger.exception("Unexpected error in session cleanup task")
                await asyncio.sleep(300)

    async def stop(self) -> None:
        """Stop the background cleanup task."""
        if not self.running:
            return

        self.running = False
        if self.task:
            self.task.cancel()

            with suppress(asyncio.CancelledError):
                await self.task

        logger.info("Session cleanup task stopped")

    def start_background_task(self) -> None:
        """Start the cleanup task in the background."""
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self.start())
