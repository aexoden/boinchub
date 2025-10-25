# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Project model for BoincHub."""

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from boinchub.models import Timestamps

if TYPE_CHECKING:
    from boinchub.models.project_attachment import ProjectAttachment
    from boinchub.models.user_project_key import UserProjectKey


class ProjectBase(SQLModel):
    """Project base model."""

    # Project properties
    name: str = Field(index=True)
    url: str = Field(unique=True)
    signed_url: str = Field(default="")
    description: str = Field(default="")
    admin_notes: str = Field(default="")
    enabled: bool = Field(default=True, index=True)


class Project(ProjectBase, Timestamps, table=True):
    """Project model."""

    # SQLAlchemy table name
    __tablename__: str = "projects"  # type: ignore[attr-defined]

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    attachments: list["ProjectAttachment"] = Relationship(back_populates="project", cascade_delete=True)
    user_keys: list["UserProjectKey"] = Relationship(back_populates="project", cascade_delete=True)


class ProjectPublic(ProjectBase, Timestamps):
    """Public project model for API responses."""

    # Primary key
    id: UUID


class ProjectCreate(ProjectBase):
    """Model for creating a new project."""


class ProjectUpdate(SQLModel):
    """Model for updating a project."""

    # Project properties
    name: str | None = None
    url: str | None = None
    signed_url: str | None = None
    description: str | None = None
    admin_notes: str | None = None
    enabled: bool | None = None
