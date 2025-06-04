# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for project attachment management."""

from fractions import Fraction
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from boinchub.core.auth import get_current_active_user, is_admin, user_has_access_to_computer
from boinchub.core.database import get_db
from boinchub.models.user import User
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
    attachment_data: ProjectAttachmentCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProjectAttachmentResponse:
    """Create a new project attachment.

    Args:
        attachment_data (ProjectAttachmentCreate): The data for the new project attachment.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        ProjectAttachmentResponse: The created project attachment.

    Raises:
        HTTPException: If the computer or project is not found, or if the user does not have access to the computer.

    """
    if not user_has_access_to_computer(db, current_user, attachment_data.computer_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    attachment = ProjectAttachmentService.create_attachment(db, attachment_data)

    if not attachment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Computer or project not found.")

    return ProjectAttachmentResponse.model_validate(attachment)


@router.get("/computer/{computer_id}")
def get_computer_attachments(
    computer_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[ProjectAttachmentResponse]:
    """Get all project attachments for a computer.

    Args:
        computer_id (int): The ID of the computer.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        list[ProjectAttachmentResponse]: A list of attachments.

    Raises:
        HTTPException: If the user does not have access to the computer.

    """
    if not user_has_access_to_computer(db, current_user, computer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    attachments = ProjectAttachmentService.get_computer_attachments(db, computer_id)
    return [ProjectAttachmentResponse.model_validate(attachment) for attachment in attachments]


@router.get("/project/{project_id}")
def get_project_attachments(
    project_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[ProjectAttachmentResponse]:
    """Get all project attachments for a project.

    Args:
        project_id (int): The ID of the project.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        list[ProjectAttachmentResponse]: A list of attachments.

    Raises:
        HTTPException: If the user does not have access to the project.

    """
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    attachments = ProjectAttachmentService.get_project_attachments(db, project_id)
    return [ProjectAttachmentResponse.model_validate(attachment) for attachment in attachments]


@router.get("/{attachment_id}")
def get_attachment(
    attachment_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProjectAttachmentResponse:
    """Get a project attachment by its ID.

    Args:
        attachment_id (int): The ID of the project attachment.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        ProjectAttachmentResponse: The project attachment data.

    Raises:
        HTTPException: If the project attachment is not found or if the user does not have access to the computer.

    """
    attachment = ProjectAttachmentService.get_attachment(db, attachment_id)

    if not attachment or not user_has_access_to_computer(db, current_user, attachment.computer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    return ProjectAttachmentResponse.model_validate(attachment)


@router.put("/{attachment_id}")
def update_attachment(
    attachment_id: Annotated[int, Path(ge=1)],
    attachment_data: ProjectAttachmentUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProjectAttachmentResponse:
    """Update a project attachment.

    Args:
        attachment_id (int): The ID of the project attachment.
        attachment_data (ProjectAttachmentUpdate): The data to update the project attachment with.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        ProjectAttachmentResponse: The updated project attachment.

    Raises:
        HTTPException: If the project attachment is not found or if the user does not have access to the computer.

    """
    attachment = ProjectAttachmentService.get_attachment(db, attachment_id)

    if not attachment or not user_has_access_to_computer(db, current_user, attachment.computer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    updated_attachment = ProjectAttachmentService.update_attachment(db, attachment_id, attachment_data)

    if not updated_attachment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update project attachment")

    return ProjectAttachmentResponse.model_validate(updated_attachment)


@router.delete("/{attachment_id}")
def delete_attachment(
    attachment_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> dict[str, str]:
    """Delete a project attachment.

    Args:
        attachment_id (int): The ID of the project attachment.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        dict[str, str]: A message indicating the result of the deletion.

    Raises:
        HTTPException: If the project attachment is not found or if the user does not have access to the computer.

    """
    attachment = ProjectAttachmentService.get_attachment(db, attachment_id)

    if not attachment or not user_has_access_to_computer(db, current_user, attachment.computer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    ProjectAttachmentService.delete_attachment(db, attachment_id)

    return {"message": "Project attachment deleted successfully."}
