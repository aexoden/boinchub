# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Invite code model for BoincHub."""

import datetime
import secrets
import string

from uuid import UUID, uuid4

from sqlmodel import DateTime, Field, Relationship, SQLModel

from boinchub.models import Timestamps
from boinchub.models.user import User


def generate_invite_code() -> str:
    """Generate a random invite code.

    Returns:
        str: A random 16-character invite code.

    """
    alphabet = string.ascii_uppercase + string.digits

    # Remove potentially confusing characters
    alphabet = alphabet.replace("0", "").replace("O", "").replace("1", "").replace("I", "").replace("L", "")

    return "".join(secrets.choice(alphabet) for _ in range(16))


class InviteCodeBase(SQLModel):
    """Invite code base model."""

    # Code properties
    code: str = Field(unique=True, default_factory=generate_invite_code)
    is_active: bool = Field(default=True)

    # Foreign keys
    created_by_user_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    used_by_user_id: UUID | None = Field(default=None, foreign_key="users.id", ondelete="SET NULL")

    # Usage tracking
    used_at: datetime.datetime | None = Field(default=None, sa_type=DateTime(timezone=True))  # type: ignore[call-overload]


class InviteCode(InviteCodeBase, Timestamps, table=True):
    """Invite code model."""

    # SQLAlchemy table name
    __tablename__: str = "invite_codes"  # type: ignore[misc]

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    created_by: User = Relationship(sa_relationship_kwargs={"foreign_keys": "[InviteCode.created_by_user_id]"})
    used_by: User | None = Relationship(sa_relationship_kwargs={"foreign_keys": "[InviteCode.used_by_user_id]"})

    @property
    def is_used(self) -> bool:
        """Check if the invite code has been used.

        Returns:
            bool: True if the invite code has been used, False otherwise.

        """
        return self.used_by is not None


class InviteCodePublic(InviteCodeBase, Timestamps):
    """Public invite code model for API responses."""

    # Primary key
    id: UUID

    # Additional properties for admin responses
    created_by_username: str | None = None
    used_by_username: str | None = None


class InviteCodeCreate(SQLModel):
    """Model for creating a new invite code."""

    code: str | None = None


class InviteCodeUpdate(SQLModel):
    """Model for updating an invite code."""

    is_active: bool | None = None
