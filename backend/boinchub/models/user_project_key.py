# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""User project key model for BoincHub."""

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

from boinchub.models import Timestamps

if TYPE_CHECKING:
    from boinchub.models.project import Project
    from boinchub.models.user import User


class UserProjectKeyBase(SQLModel):
    """User project key base model."""

    # Foreign keys
    user_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    project_id: UUID = Field(foreign_key="projects.id", ondelete="CASCADE", index=True)

    # Account key
    account_key: str = Field(default="")


class UserProjectKey(UserProjectKeyBase, Timestamps, table=True):
    """User project key model."""

    # SQLAlchemy table name and constraints
    __tablename__: str = "user_project_keys"  # type: ignore[attr-defined]
    __table_args__ = (UniqueConstraint("user_id", "project_id"),)

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    user: "User" = Relationship(back_populates="project_keys")
    project: "Project" = Relationship(back_populates="user_keys")


class UserProjectKeyPublic(UserProjectKeyBase, Timestamps):
    """Public model for user project key in API responses."""

    # Primary key
    id: UUID


class UserProjectKeyCreate(UserProjectKeyBase):
    """Model for creating a new user project key."""


class UserProjectKeyUpdate(SQLModel):
    """Model for updating a user project key."""

    # Account key
    account_key: str | None = None
