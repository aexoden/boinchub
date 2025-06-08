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


class ProjectAttachmentService:
    """Service for project attachment-related operations."""

    def __init__(self, db: Session) -> None:
        """Initialize the ProjectAttachmentService with a database session.

        Args:
            db (Session): The database session to use.

        """
        self.db = db

    def create_project_attachment(self, project_attachment_data: ProjectAttachmentCreate) -> ProjectAttachment:
        """Create a new project attachment.

        Args:
            attachment_data (ProjectAttachmentCreate): The data for the new project attachment.

        Returns:
            ProjectAttachment: The created project attachment object.

        """
        project_attachment = ProjectAttachment.model_validate(project_attachment_data)

        self.db.add(project_attachment)
        self.db.commit()
        self.db.refresh(project_attachment)

        return project_attachment

    def delete_project_attachment(self, project_attachment_id: UUID) -> bool:
        """Delete a project attachment.

        Args:
            project_attachment_id (UUID): The ID of the project attachment to delete.

        Returns:
            bool: True if the project attachment exists and was deleted, False otherwise.

        """
        project_attachment = self.get_project_attachment(project_attachment_id)

        if not project_attachment:
            return False

        self.db.delete(project_attachment)
        self.db.commit()

        return True

    def get_project_attachment(self, project_attachment_id: UUID) -> ProjectAttachment | None:
        """Get a project attachment by ID.

        Args:
            project_attachment_id (UUID): The ID of the project attachment.

        Returns:
            ProjectAttachment | None: The project attachment object if it exists, None otherwise.

        """
        return self.db.get(ProjectAttachment, project_attachment_id)

    def get_project_attachments_for_computer(self, computer_id: UUID) -> list[ProjectAttachment]:
        """Get all project attachments for a computer.

        Args:
            computer_id (UUID): The ID of the computer.

        Returns:
            list[ProjectAttachment]: A list of project attachment objects for the specific computer.

        """
        return list(self.db.exec(select(ProjectAttachment).where(ProjectAttachment.computer_id == computer_id)).all())

    def get_project_attachments_for_project(self, project_id: UUID) -> list[ProjectAttachment]:
        """Get all project attachments for a project.

        Args:
            project_id (UUID): The ID of the project.

        Returns:
            list[ProjectAttachment]: A list of project attachment objects for the specific project.

        """
        return list(self.db.exec(select(ProjectAttachment).where(ProjectAttachment.project_id == project_id)).all())

    def update_project_attachment(
        self, project_attachment_id: UUID, project_attachment_data: ProjectAttachmentUpdate
    ) -> ProjectAttachment | None:
        """Update a project attachment.

        Args:
            project_attachment_id (UUID): The ID of the project attachment to update.
            project_attachment_data (ProjectAttachmentUpdate): The data for the updated project attachment.

        Returns:
            ProjectAttachment | None: The updated project attachment object if it exists, None otherwise.

        """
        project_attachment = self.get_project_attachment(project_attachment_id)

        if project_attachment:
            update_data = project_attachment_data.model_dump(exclude_none=True)
            project_attachment.sqlmodel_update(update_data)

            self.db.add(project_attachment)
            self.db.commit()
            self.db.refresh(project_attachment)

        return project_attachment


def get_project_attachment_service(db: Annotated[Session, Depends(get_db)]) -> ProjectAttachmentService:
    """Get the project attachment service.

    Args:
        db (Session): The database session.

    Returns:
        ProjectAttachmentService: An instance of the project attachment service.

    """
    return ProjectAttachmentService(db)
