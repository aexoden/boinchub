# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Project attachment model for BoincHub."""

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

from boinchub.models import Timestamps

if TYPE_CHECKING:
    from boinchub.models.computer import Computer
    from boinchub.models.project import Project


class ProjectAttachmentBase(SQLModel):
    """Project attachment base model."""

    # Foreign keys
    computer_id: UUID = Field(foreign_key="computers.id", ondelete="CASCADE", index=True)
    project_id: UUID = Field(foreign_key="projects.id", ondelete="CASCADE", index=True)

    # Project-specific settings
    resource_share: Decimal = Field(default=100, max_digits=18, decimal_places=6)
    suspended: bool = Field(default=False)
    dont_request_more_work: bool = Field(default=False)
    detach_when_done: bool = Field(default=False)

    # Resource allocation settings
    no_cpu: bool = Field(default=False)
    no_gpu_nvidia: bool = Field(default=False)
    no_gpu_amd: bool = Field(default=False)
    no_gpu_intel: bool = Field(default=False)


class ProjectAttachment(ProjectAttachmentBase, Timestamps, table=True):
    """Project attachment model."""

    # SQLAlchemy table name and constraints
    __tablename__: str = "project_attachments"  # type: ignore[attr-defined]
    __table_args__ = (UniqueConstraint("computer_id", "project_id"),)

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    computer: Computer = Relationship(back_populates="project_attachments")
    project: Project = Relationship(back_populates="attachments")


class ProjectAttachmentPublic(ProjectAttachmentBase, Timestamps):
    """Public model for project attachment in API responses."""

    # Primary key
    id: UUID


class ProjectAttachmentCreate(ProjectAttachmentBase):
    """Model for creating a new project attachment."""


class ProjectAttachmentUpdate(SQLModel):
    """Model for updating a project attachment."""

    # Project-specific settings
    resource_share: Decimal | None = None
    suspended: bool | None = None
    dont_request_more_work: bool | None = None
    detach_when_done: bool | None = None

    # Resource allocation settings
    no_cpu: bool | None = None
    no_gpu_nvidia: bool | None = None
    no_gpu_amd: bool | None = None
    no_gpu_intel: bool | None = None
