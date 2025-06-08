# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""User model for BoincHub."""

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from boinchub.models import Timestamps

if TYPE_CHECKING:
    from boinchub.models.computer import Computer


class UserBase(SQLModel, Timestamps):
    """User base model."""

    # User properties
    username: str = Field(unique=True)
    email: str
    role: str = Field(default="user")
    is_active: bool = Field(default=True)


class User(UserBase, table=True):
    """User model."""

    # SQLAlchemy table name
    __tablename__: str = "users"  # type: ignore[attr-defined]

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    computers: list["Computer"] = Relationship(back_populates="user", cascade_delete=True)

    # User properties
    password_hash: str
    boinc_password_hash: str


class UserPublic(UserBase):
    """Public user model for API responses."""

    # Primary key
    id: UUID


class UserCreate(UserBase):
    """Model for creating a new user."""

    # User properties
    password: str


class UserUpdate(SQLModel):
    """Model for updating an existing user."""

    # User properties
    password: str | None = None
    email: str | None = None
    role: str | None = None
    is_active: bool | None = None
