# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""User session model for BoincHub."""

import datetime

from uuid import UUID, uuid4

from sqlmodel import DateTime, Field, Relationship, SQLModel

from boinchub.models import Timestamps
from boinchub.models.user import User


class UserSessionBase(SQLModel):
    """Base model for user sessions."""

    # Device/session identification
    device_name: str = Field(max_length=255, description="Human-readable device name")
    device_fingerprint: str = Field(max_length=255, description="Unique device identifer")
    user_agent: str = Field(max_length=1000, description="Browser/client user agent string")
    ip_address: str = Field(max_length=45, description="IP address of the sesion")

    # Session metadata
    is_active: bool = Field(default=True)
    last_accessed_at: datetime.datetime = Field(
        sa_type=DateTime(timezone=True),  # type: ignore[arg-type],
        default_factory=lambda: datetime.datetime.now(datetime.UTC),
    )


class UserSession(UserSessionBase, Timestamps, table=True):
    """User session model for tracking active authentication sessions."""

    __tablename__: str = "user_sessions"  # type: ignore[name-defined]

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Foreign keys
    user_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE")

    # Relationships
    user: User = Relationship(back_populates="sessions")

    # Token information
    refresh_token_hash: str = Field(description="Hashed refresh token")
    refresh_token_expires_at: datetime.datetime = Field(description="Expiration time for the refresh token")


class UserSessionCreate(UserSessionBase):
    """Model for creating a new user session."""

    user_id: UUID
    refresh_token_hash: str
    refresh_token_expires_at: datetime.datetime


class UserSessionPublic(UserSessionBase, Timestamps):
    """Public user session model for API responses."""

    id: UUID
    is_current: bool = False


class UserSessionUpdate(SQLModel):
    """Model for updating a user session."""

    device_name: str | None = None
    last_accessed_at: datetime.datetime | None = None
    is_active: bool | None = None
