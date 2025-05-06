# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for project attachment-related operations."""

from fractions import Fraction

from pydantic import BaseModel
from sqlalchemy.orm import Session

from boinchub.models.computer import Computer
from boinchub.models.project import Project
from boinchub.models.project_attachment import ProjectAttachment


class ProjectAttachmentCreate(BaseModel):
    """Model for creating a new project attachment."""

    computer_id: int
    project_id: int
    resource_share: Fraction = Fraction(100)
    suspended: bool = False
    dont_request_more_work: bool = False
    detach_when_done: bool = False
    no_cpu: bool = False
    no_gpu_nvidia: bool = False
    no_gpu_amd: bool = False
    no_gpu_intel: bool = False
    authenticator: str


class ProjectAttachmentUpdate(BaseModel):
    """Model for updating a project attachment."""

    resource_share: Fraction | None = None
    suspended: bool | None = None
    dont_request_more_work: bool | None = None
    detach_when_done: bool | None = None
    no_cpu: bool | None = None
    no_gpu_nvidia: bool | None = None
    no_gpu_amd: bool | None = None
    no_gpu_intel: bool | None = None
    authenticator: str | None = None


class ProjectAttachmentService:
    """Service for project attachment-related operations."""

    @staticmethod
    def create_attachment(db: Session, attachment_data: ProjectAttachmentCreate) -> ProjectAttachment | None:
        """Create a new project attachment.

        Args:
            db (Session): The database session.
            attachment_data (ProjectAttachmentCreate): The data for the new project attachment.

        Returns:
            The created project attachment object or None if computer or project not found.
        """
        # Check if the computer and project exist
        computer = db.query(Computer).filter(Computer.id == attachment_data.computer_id).first()
        project = db.query(Project).filter(Project.id == attachment_data.project_id).first()

        if not computer or not project:
            return None

        existing = (
            db.query(ProjectAttachment)
            .filter(
                ProjectAttachment.computer_id == attachment_data.computer_id,
                ProjectAttachment.project_id == attachment_data.project_id,
            )
            .first()
        )

        if existing:
            return existing

        # Create the new project attachment
        db_attachment = ProjectAttachment(
            computer=computer,
            project=project,
            resource_share=attachment_data.resource_share,
            suspended=attachment_data.suspended,
            dont_request_more_work=attachment_data.dont_request_more_work,
            detach_when_done=attachment_data.detach_when_done,
            no_cpu=attachment_data.no_cpu,
            no_gpu_nvidia=attachment_data.no_gpu_nvidia,
            no_gpu_amd=attachment_data.no_gpu_amd,
            no_gpu_intel=attachment_data.no_gpu_intel,
            authenticator=attachment_data.authenticator,
        )

        db.add(db_attachment)
        db.commit()

        return db_attachment

    @staticmethod
    def get_attachment(db: Session, attachment_id: int) -> ProjectAttachment | None:
        """Get a project attachment by ID.

        Args:
            db (Session): The database session.
            attachment_id (int): The ID of the project attachment.

        Returns:
            The project attachment object or None if not found.

        """
        return db.query(ProjectAttachment).filter(ProjectAttachment.id == attachment_id).first()

    @staticmethod
    def get_computer_attachments(db: Session, computer_id: int) -> list[ProjectAttachment]:
        """Get all project attachments for a computer.

        Args:
            db (Session): The database session.
            computer_id (int): The ID of the computer.

        Returns:
            A list of project attachment objects.

        """
        return db.query(ProjectAttachment).filter(ProjectAttachment.computer_id == computer_id).all()

    @staticmethod
    def get_project_attachments(db: Session, project_id: int) -> list[ProjectAttachment]:
        """Get all project attachments for a project.

        Args:
            db (Session): The database session.
            project_id (int): The ID of the project.

        Returns:
            A list of project attachment objects.

        """
        return db.query(ProjectAttachment).filter(ProjectAttachment.project_id == project_id).all()

    @staticmethod
    def update_attachment(
        db: Session, attachment_id: int, attachment_data: ProjectAttachmentUpdate
    ) -> ProjectAttachment | None:
        """Update a project attachment.

        Args:
            db (Session): The database session.
            attachment_id (int): The ID of the project attachment.
            attachment_data (ProjectAttachmentUpdate): The data for the updated project attachment.

        Returns:
            The updated project attachment object or None if not found.

        """
        attachment = ProjectAttachmentService.get_attachment(db, attachment_id)

        if not attachment:
            return None

        update_data = attachment_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(attachment, key, value)

        db.commit()

        return attachment

    @staticmethod
    def delete_attachment(db: Session, attachment_id: int) -> bool:
        """Delete a project attachment.

        Args:
            db (Session): The database session.
            attachment_id (int): The ID of the project attachment to delete.

        Returns:
            True if the project attachment was deleted, False if not found.

        """
        attachment = ProjectAttachmentService.get_attachment(db, attachment_id)

        if not attachment:
            return False

        db.delete(attachment)
        db.commit()

        return True
