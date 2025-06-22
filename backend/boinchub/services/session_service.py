# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for managing user authentication sessions."""

import datetime

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlmodel import Session, col, select

from boinchub.core.database import get_db
from boinchub.core.security import REFRESH_TOKEN_EXPIRE_DAYS, TokenPair, create_token_pair, hash_refresh_token
from boinchub.models.user_session import UserSession, UserSessionCreate, UserSessionUpdate
from boinchub.services.base_service import BaseService


class SessionService(BaseService[UserSession, UserSessionCreate, UserSessionUpdate]):
    """Service for managing user authentication sessions."""

    model = UserSession

    def create_session(
        self,
        user_id: UUID,
        device_name: str,
        device_fingerprint: str,
        user_agent: str,
        ip_address: str,
    ) -> tuple[UserSession, TokenPair]:
        """Create a new user session.

        Args:
            user_id (UUID): The ID of the user.
            refresh_token (str): The refresh token for the session.
            device_name (str): The name of the device.
            device_fingerprint (str): A unique fingerprint for the device.
            user_agent (str): The user agent string of the client.
            ip_address (str): The IP address of the client.

        Returns:
            tuple[UserSession, TokenPair]: The created session and the token pair.

        """
        session_data = UserSessionCreate(
            user_id=user_id,
            device_name=device_name,
            device_fingerprint=device_fingerprint,
            user_agent=user_agent,
            ip_address=ip_address,
            refresh_token_hash="",  # Will be set after token generation
            refresh_token_expires_at=datetime.datetime.now(datetime.UTC)
            + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )

        session = self.create(session_data)

        # Generate refresh token and update session
        token_pair = create_token_pair(user_id, session.id)

        session.refresh_token_hash = hash_refresh_token(token_pair.refresh_token)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return session, token_pair

    def get_session_by_refresh_token(self, refresh_token: str) -> UserSession | None:
        """Get a session by refresh token.

        Args:
            refresh_token (str): The refresh token to search for.

        Returns:
            UserSession | None: The session if found and valid, otherwise None.

        """
        token_hash = hash_refresh_token(refresh_token)

        return self.db.exec(
            select(UserSession).where(
                UserSession.refresh_token_hash == token_hash,
                UserSession.is_active == True,  # noqa: E712
                UserSession.refresh_token_expires_at > datetime.datetime.now(datetime.UTC),
            )
        ).first()

    def get_user_sessions(self, user_id: UUID, *, active_only: bool = True) -> list[UserSession]:
        """Get all sessions for a user.

        Args:
            user_id (UUID): The ID of the user.
            active_only (bool): Whether to return only active sessions.

        Returns:
            list[UserSession]: A list of user sessions.

        """
        query = select(UserSession).where(UserSession.user_id == user_id)

        if active_only:
            query = query.where(
                UserSession.is_active == True,  # noqa: E712
                UserSession.refresh_token_expires_at > datetime.datetime.now(datetime.UTC),
            )

        return list(self.db.exec(query.order_by(col(UserSession.last_accessed_at).desc())).all())

    def revoke_session(self, session_id: UUID) -> bool:
        """Revoke a specific session.

        Args:
            session_id (UUID): The ID of the session to revoke.

        Returns:
            bool: True if the session was successfully revoked, False if not found.

        """
        session = self.get(session_id)

        if not session:
            return False

        session.is_active = False
        self.db.add(session)
        self.db.commit()
        return True

    def revoke_all_user_sessions(self, user_id: UUID, except_session_id: UUID | None = None) -> int:
        """Revoke all sessions for a user, optionally excluding a specific session.

        Args:
            user_id (UUID): The ID of the user.
            except_session_id (UUID | None): An optional session ID to exclude from revocation.

        Returns:
            int: Number of sessions revoked.

        """
        query = select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.is_active == True,  # noqa: E712
        )

        if except_session_id:
            query = query.where(UserSession.id != except_session_id)

        sessions = list(self.db.exec(query).all())

        for session in sessions:
            session.is_active = False
            self.db.add(session)

        self.db.commit()
        return len(sessions)

    def update_session_access(
        self, session_id: UUID, refresh_token: str | None = None, ip_address: str | None = None
    ) -> None:
        """Update session last accessed time and optionally IP address.

        Args:
            session_id (UUID): The ID of the session to update.
            refresh_token (str | None): Optional new refresh token for the session.
            ip_address (str | None): Optional new IP address for the session.

        """
        session = self.get(session_id)

        if session and session.is_active:
            session.last_accessed_at = datetime.datetime.now(datetime.UTC)

            if refresh_token:
                session.refresh_token_hash = hash_refresh_token(refresh_token)
                session.refresh_token_expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
                    days=REFRESH_TOKEN_EXPIRE_DAYS
                )

            if ip_address and ip_address != session.ip_address:
                session.ip_address = ip_address

            self.db.add(session)
            self.db.commit()

    def cleanup_expired_sessions(self) -> int:
        """Mark expired sessions as inactive.

        Returns:
            int: Number of sessions cleaned up.

        """
        expired_sessions = list(
            self.db.exec(
                select(UserSession).where(UserSession.refresh_token_expires_at <= datetime.datetime.now(datetime.UTC))
            ).all()
        )

        for session in expired_sessions:
            session.is_active = False
            self.db.add(session)

        self.db.commit()
        return len(expired_sessions)

    def cleanup_inactive_sessions(self, retention_days: int = 7) -> int:
        """Remove inactive sessions that have not been accessed recently.

        Args:
            retention_days (int): Number of days to retain inactive sessions.

        Returns:
            int: Number of sessions cleaned up.

        """
        cutoff_date = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=retention_days)

        sessions = list(
            self.db.exec(
                select(UserSession).where(UserSession.is_active == False, UserSession.updated_at <= cutoff_date)  # noqa: E712
            ).all()
        )

        for session in sessions:
            self.db.delete(session)

        self.db.commit()

        return len(sessions)

    def get_session_by_id_and_user(self, session_id: UUID, user_id: UUID) -> UserSession | None:
        """Get a session by ID that belongs to a specific user.

        Args:
            session_id (UUID): The ID of the session.
            user_id (UUID): The ID of the user.

        Returns:
            UserSession | None: The session if found and belongs to the user, otherwise None.

        """
        return self.db.exec(
            select(UserSession).where(
                UserSession.id == session_id,
                UserSession.user_id == user_id,
                UserSession.is_active == True,  # noqa: E712
            )
        ).first()


def get_session_service(db: Annotated[Session, Depends(get_db)]) -> SessionService:
    """Get the session service.

    Args:
        db (Session): The database session.

    Returns:
        SessionService: The session service instance.

    """
    return SessionService(db)
