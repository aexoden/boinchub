# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for project attachment management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status

from boinchub.core.security import get_current_user_if_active
from boinchub.models.project_attachment import ProjectAttachmentCreate, ProjectAttachmentPublic, ProjectAttachmentUpdate
from boinchub.models.user import User
from boinchub.services.computer_service import ComputerService, get_computer_service
from boinchub.services.project_attachment_service import ProjectAttachmentService, get_project_attachment_service

router = APIRouter(prefix="/api/v1/project_attachments", tags=["project_attachments"])


@router.post("")
def create_project_attachment(
    project_attachment_data: ProjectAttachmentCreate,
    computer_service: Annotated[ComputerService, Depends(get_computer_service)],
    project_attachment_service: Annotated[ProjectAttachmentService, Depends(get_project_attachment_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ProjectAttachmentPublic:
    """Create a new project attachment.

    Args:
        project_attachment_data (ProjectAttachmentCreate): The data for the new project attachment.
        project_attachment_service (ProjectAttachmentService): The service for project attachment operations.
        current_user (User): The current authenticated user.

    Returns:
        ProjectAttachmentPublic: The created project attachment.

    Raises:
        HTTPException: If the computer or project is not found, or if the user does not have access to the computer.

    """
    computer = computer_service.get(project_attachment_data.computer_id)

    if not computer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    if current_user.role != "admin" and computer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    project_attachment = project_attachment_service.create(project_attachment_data)

    if not project_attachment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project not found.")

    return ProjectAttachmentPublic.model_validate(project_attachment)


@router.get("/{project_attachment_id}")
def get_project_attachment(
    project_attachment_id: Annotated[UUID, Path()],
    project_attachment_service: Annotated[ProjectAttachmentService, Depends(get_project_attachment_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ProjectAttachmentPublic:
    """Get a project attachment by ID.

    Args:
        project_attachment_id (int): The ID of the project attachment.
        project_attachment_service (ProjectAttachmentService): The service for project attachment operations.
        current_user (User): The current authenticated user.

    Returns:
        ProjectAttachmentPublic: The requested project attachment.

    Raises:
        HTTPException: If the project attachment is not found or if the user does not have access to the computer.

    """
    project_attachment = project_attachment_service.get(project_attachment_id)

    if not project_attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    if current_user.role != "admin" and project_attachment.computer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    return ProjectAttachmentPublic.model_validate(project_attachment)


@router.patch("/{project_attachment_id}")
def update_attachment(
    project_attachment_id: Annotated[UUID, Path()],
    project_attachment_data: ProjectAttachmentUpdate,
    project_attachment_service: Annotated[ProjectAttachmentService, Depends(get_project_attachment_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ProjectAttachmentPublic:
    """Update a project attachment.

    Args:
        project_attachment_id (int): The ID of the project attachment.
        project_attachment_data (ProjectAttachmentUpdate): The data to update the project attachment with.
        project_attachment_service (ProjectAttachmentService): The service for project attachment operations.
        current_user (User): The current authenticated user.

    Returns:
        ProjectAttachmentPublic: The updated project attachment.

    Raises:
        HTTPException: If the project attachment is not found or if the user does not have access to the computer.

    """
    project_attachment = project_attachment_service.get(project_attachment_id)

    if not project_attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    if current_user.role != "admin" and project_attachment.computer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    updated_attachment = project_attachment_service.update(project_attachment_id, project_attachment_data)

    if not updated_attachment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update project attachment")

    return ProjectAttachmentPublic.model_validate(updated_attachment)


@router.delete("/{project_attachment_id}")
def delete_attachment(
    project_attachment_id: Annotated[UUID, Path()],
    project_attachment_service: Annotated[ProjectAttachmentService, Depends(get_project_attachment_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> dict[str, str]:
    """Delete a project attachment.

    Args:
        project_attachment_id (int): The ID of the project attachment.
        project_attachment_service (ProjectAttachmentService): The service for project attachment operations.
        current_user (User): The current authenticated user.

    Returns:
        dict[str, str]: A message indicating the result of the deletion.

    Raises:
        HTTPException: If the project attachment is not found or if the user does not have access to the computer.

    """
    project_attachment = project_attachment_service.get(project_attachment_id)

    if not project_attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    if current_user.role != "admin" and project_attachment.computer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    success = project_attachment_service.delete(project_attachment_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project attachment not found")

    return {"message": "Project attachment deleted successfully."}
