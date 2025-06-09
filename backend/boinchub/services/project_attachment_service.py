# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for project attachment-related operations."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.models.project_attachment import ProjectAttachment, ProjectAttachmentCreate, ProjectAttachmentUpdate
from boinchub.services.base_service import BaseService


class ProjectAttachmentService(BaseService[ProjectAttachment, ProjectAttachmentCreate, ProjectAttachmentUpdate]):
    """Service for project attachment-related operations."""

    model = ProjectAttachment

    def get_for_computer(self, computer_id: UUID) -> list[ProjectAttachment]:
        """Get all project attachments for a computer.

        Args:
            computer_id (UUID): The ID of the computer.

        Returns:
            list[ProjectAttachment]: A list of project attachment objects for the specific computer.

        """
        return list(self.db.exec(select(ProjectAttachment).where(ProjectAttachment.computer_id == computer_id)).all())

    def get_for_project(self, project_id: UUID) -> list[ProjectAttachment]:
        """Get all project attachments for a project.

        Args:
            project_id (UUID): The ID of the project.

        Returns:
            list[ProjectAttachment]: A list of project attachment objects for the specific project.

        """
        return list(self.db.exec(select(ProjectAttachment).where(ProjectAttachment.project_id == project_id)).all())


def get_project_attachment_service(db: Annotated[Session, Depends(get_db)]) -> ProjectAttachmentService:
    """Get the project attachment service.

    Args:
        db (Session): The database session.

    Returns:
        ProjectAttachmentService: An instance of the project attachment service.

    """
    return ProjectAttachmentService(db)
