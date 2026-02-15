# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""User session model for BoincHub."""

import datetime
import re

from uuid import UUID, uuid4

from pydantic import field_validator
from sqlmodel import DateTime, Field, Relationship, SQLModel

from boinchub.models.user import User
from boinchub.models.util import Timestamps


class UserSessionBase(SQLModel):
    """Base model for user sessions."""

    # Device/session identification
    device_name: str = Field(max_length=255, description="Human-readable device name")
    device_fingerprint: str = Field(max_length=255, description="Unique device identifer")
    user_agent: str = Field(max_length=1000, description="Browser/client user agent string")
    ip_address: str = Field(max_length=45, description="IP address of the session")

    # Session metadata
    is_active: bool = Field(default=True)
    last_accessed_at: datetime.datetime = Field(
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        default_factory=lambda: datetime.datetime.now(datetime.UTC),
    )

    @field_validator("device_name")
    @classmethod
    def validate_device_name(cls, value: str) -> str:
        """Validate and sanitize device name.

        Args:
            value (str): The device name to validate.

        Returns:
            str: Sanitized device name, or "Unknown Device" if empty.

        """
        if not value or not value.strip():
            return "Unknown Device"

        sanitized = re.sub(r'[<>"\'\\\x00-\x1f\x7f-\x9f]', "", value.strip())
        return sanitized[:255]

    @field_validator("user_agent")
    @classmethod
    def validate_user_agent(cls, value: str) -> str:
        """Validate and sanitize user agent string.

        Args:
            value (str): The user agent string to validate.

        Returns:
            str: Sanitized user agent string, or "Unknown" if empty.

        """
        if not value or not value.strip():
            return "Unknown"

        sanitized = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", value.strip())
        return sanitized[:1000]

    @field_validator("ip_address")
    @classmethod
    def validate_ip_address(cls, value: str) -> str:
        """Validate IP address format.

        Args:
            value (str): The IP address to validate.

        Returns:
            str: Validated IP address, or "Unknown" if empty.

        """
        if not value:
            return "Unknown"

        # Basic IP validation (IPv4 and IPv6)
        ipv4_pattern = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
        ipv6_pattern = r"^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$"

        if re.match(ipv4_pattern, value) or re.match(ipv6_pattern, value):
            return value

        # If not a valid IP, sanitize but keep for logging purposes
        return re.sub(r"[^0-9a-fA-F:.%-]", "", value)[:45]


class UserSession(UserSessionBase, Timestamps, table=True):
    """User session model for tracking active authentication sessions."""

    __tablename__: str = "user_sessions"  # type: ignore[misc]

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
