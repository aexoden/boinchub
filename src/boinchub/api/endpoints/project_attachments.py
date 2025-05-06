# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for project attachment management."""

from fractions import Fraction
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from boinchub.core.database import get_db
from boinchub.services.project_attachment_service import (
    ProjectAttachmentCreate,
    ProjectAttachmentService,
    ProjectAttachmentUpdate,
)

router = APIRouter(prefix="/api/v1/attachments", tags=["attachments"])


class ProjectAttachmentResponse(BaseModel):
    """Response model for project attachment data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    computer_id: int
    project_id: int
    resource_share: Fraction
    suspended: bool
    dont_request_more_work: bool
    detach_when_done: bool
    no_cpu: bool
    no_gpu_nvidia: bool
    no_gpu_amd: bool
    no_gpu_intel: bool
    authenticator: str


@router.post("")
def create_attachment(
    attachment_data: ProjectAttachmentCreate, db: Annotated[Session, Depends(get_db)]
) -> ProjectAttachmentResponse:
    """Create a new project attachment.

    Args:
        attachment_data (ProjectAttachmentCreate): The data for the new project attachment.
        db (Session): The database session.

    Returns:
        ProjectAttachmentResponse: The created project attachment.

    Raises:
        HTTPException: If the computer or project is not found.

    """
    attachment = ProjectAttachmentService.create_attachment(db, attachment_data)

    if not attachment:
        raise HTTPException(status_code=400, detail="Computer or project not found.")

    return ProjectAttachmentResponse.model_validate(attachment)


@router.get("/computer/{computer_id}")
def get_computer_attachments(
    computer_id: Annotated[int, Path(ge=1)], db: Annotated[Session, Depends(get_db)]
) -> list[ProjectAttachmentResponse]:
    """Get all project attachmetns for a computer.

    Args:
        computer_id (int): The ID of the computer.
        db (Session): The database session.

    Returns:
        list[ProjectAttachmentResponse]: A list of attachments.

    """
    attachments = ProjectAttachmentService.get_computer_attachments(db, computer_id)
    return [ProjectAttachmentResponse.model_validate(attachment) for attachment in attachments]


@router.get("/project/{project_id}")
def get_project_attachments(
    project_id: Annotated[int, Path(get=1)], db: Annotated[Session, Depends(get_db)]
) -> list[ProjectAttachmentResponse]:
    """Get all project attachments for a project.

    Args:
        project_id (int): The ID of the project.
        db (Session): The database session.

    Returns:
        list[ProjectAttachmentResponse]: A list of attachments.

    """
    attachments = ProjectAttachmentService.get_project_attachments(db, project_id)
    return [ProjectAttachmentResponse.model_validate(attachment) for attachment in attachments]


@router.get("/{attachment_id}")
def get_attachment(
    attachment_id: Annotated[int, Path(ge=1)], db: Annotated[Session, Depends(get_db)]
) -> ProjectAttachmentResponse:
    """Get a project attachment by its ID.

    Args:
        attachment_id (int): The ID of the project attachment.
        db (Session): The database session.

    Returns:
        ProjectAttachmentResponse: The project attachment data.

    Raises:
        HTTPException: If the project attachment is not found.

    """
    attachment = ProjectAttachmentService.get_attachment(db, attachment_id)

    if not attachment:
        raise HTTPException(status_code=404, detail="Project attachment not found")

    return ProjectAttachmentResponse.model_validate(attachment)


@router.put("/{attachment_id}")
def update_attachment(
    attachment_id: Annotated[int, Path(ge=1)],
    attachment_data: ProjectAttachmentUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> ProjectAttachmentResponse:
    """Update a project attachment.

    Args:
        attachment_id (int): The ID of the project attachment.
        attachment_data (ProjectAttachmentUpdate): The data to update the project attachment with.
        db (Session): The database session.

    Returns:
        ProjectAttachmentResponse: The updated project attachment.

    Raises:
        HTTPException: If the project attachment is not found.

    """
    attachment = ProjectAttachmentService.update_attachment(db, attachment_id, attachment_data)

    if not attachment:
        raise HTTPException(status_code=404, detail="Project attachment not found")

    return ProjectAttachmentResponse.model_validate(attachment)


@router.delete("/{attachment_id}")
def delete_attachment(
    attachment_id: Annotated[int, Path(ge=1)], db: Annotated[Session, Depends(get_db)]
) -> dict[str, str]:
    """Delete a project attachment.

    Args:
        attachment_id (int): The ID of the project attachment.
        db (Session): The database session.

    Returns:
        dict[str, str]: A message indicating the result of the deletion.

    Raises:
        HTTPException: If the project attachment is not found.

    """
    if not ProjectAttachmentService.delete_attachment(db, attachment_id):
        raise HTTPException(status_code=404, detail="Project attachment not found")

    return {"message": "Project attachment deleted successfully."}
