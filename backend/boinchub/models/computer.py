# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Computer model for BoincHub."""

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

from boinchub.models import Timestamps
from boinchub.models.user import User

if TYPE_CHECKING:
    from boinchub.models.project_attachment import ProjectAttachment


class ComputerBase(SQLModel, Timestamps):
    """Computer base model."""

    # Computer properties
    cpid: str = Field(index=True)
    hostname: str

    # Foreign keys
    user_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)


class Computer(ComputerBase, table=True):
    """Computer model."""

    # SQLAlchemy table name and constraints
    __tablename__: str = "computers"  # type: ignore[attr-defined]
    __table_args__ = (UniqueConstraint("user_id", "cpid"),)

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    project_attachments: list["ProjectAttachment"] = Relationship(back_populates="computer", cascade_delete=True)
    user: User = Relationship(back_populates="computers")


class ComputerPublic(ComputerBase):
    """Public computer model for API responses."""

    # Primary key
    id: UUID


class ComputerCreate(ComputerBase):
    """Model for creating a new computer."""


class ComputerUpdate(SQLModel):
    """Model for updating a computer."""

    # Computer properties
    cpid: str | None = None
    hostname: str | None = None

    # Relationships
    user: User | None = None
