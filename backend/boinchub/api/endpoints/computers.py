# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for computer management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status

from boinchub.core.security import get_current_user_if_active
from boinchub.models.computer import ComputerPublic, ComputerUpdate
from boinchub.models.project_attachment import ProjectAttachmentPublic
from boinchub.models.user import User
from boinchub.services.computer_service import ComputerService, get_computer_service
from boinchub.services.preference_group_service import PreferenceGroupService, get_preference_group_service
from boinchub.services.project_attachment_service import ProjectAttachmentService, get_project_attachment_service

router = APIRouter(prefix="/api/v1/computers", tags=["computers"])


@router.get("/")
def get_computers(
    computer_service: Annotated[ComputerService, Depends(get_computer_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> list[ComputerPublic]:
    """Get a list of computers.

    Args:
        computer_service (ComputerService): The service for computer operations.
        current_user (User): The current authenticated user.

    Returns:
        list[ComputerPublic]: A list of computers accessible to the user.

    Raises:
        HTTPException: If the user does not have access to any computers.
    """
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    computers = computer_service.get_all()

    return [ComputerPublic.model_validate(computer) for computer in computers]


@router.get("/{computer_id}")
def get_computer(
    computer_id: Annotated[UUID, Path()],
    computer_service: Annotated[ComputerService, Depends(get_computer_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ComputerPublic:
    """Get a computer by ID.

    Args:
        computer_id (UUID): The ID of the computer to retrieve.
        computer_service (ComputerService): The service for computer operations.
        current_user (User): The current authenticated user.

    Returns:
        ComputerPublic: The requested computer data.

    Raises:
        HTTPException: If the computer does not exist or the user does not have access.
    """
    computer = computer_service.get(computer_id)

    if not computer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    if current_user.role not in {"admin", "super_admin"} and computer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    return ComputerPublic.model_validate(computer)


@router.patch("/{computer_id}")
def update_computer(
    computer_id: Annotated[UUID, Path()],
    computer_data: ComputerUpdate,
    computer_service: Annotated[ComputerService, Depends(get_computer_service)],
    preference_group_service: Annotated[PreferenceGroupService, Depends(get_preference_group_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ComputerPublic:
    """Update a computer's details.

    Args:
        computer_id (UUID): The ID of the computer to update.
        computer_data (ComputerUpdate): The data to update the computer with.
        computer_service (ComputerService): The service for computer operations.
        preference_group_service (PreferenceGroupService): The service for preference group operations.
        current_user (User): The current authenticated user.

    Returns:
        ComputerPublic: The updated computer data.

    Raises:
        HTTPException: If the computer does not exist or the user does not have access.

    """
    computer = computer_service.get(computer_id)

    if not computer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    if current_user.role not in {"admin", "super_admin"} and computer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    if computer_data.preference_group_id:
        preference_group = preference_group_service.get(computer_data.preference_group_id)
        if not preference_group:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid preference group ID")

        if preference_group.user_id is not None and preference_group.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid preference group ID")

    updated_computer = computer_service.update(computer_id, computer_data)

    return ComputerPublic.model_validate(updated_computer)


@router.get("/{computer_id}/project_attachments")
def get_project_attachments(
    computer_id: Annotated[UUID, Path()],
    computer_service: Annotated[ComputerService, Depends(get_computer_service)],
    project_attachment_service: Annotated[ProjectAttachmentService, Depends(get_project_attachment_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> list[ProjectAttachmentPublic]:
    """Get all project attachments for a computer.

    Args:
        computer_id (UUID): The ID of the computer.
        computer_service (ComputerService): The service for computer operations.
        project_attachment_service (ProjectAttachmentService): The service for project attachment operations.
        current_user (User): The current authenticated user.

    Returns:
        list[ProjectAttachmentPublic]: A list of attachments.

    Raises:
        HTTPException: If the user does not have access to the computer.

    """
    computer = computer_service.get(computer_id)

    if not computer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    if current_user.role not in {"admin", "super_admin"} and computer.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    project_attachments = project_attachment_service.get_by_computer(computer_id)

    return [ProjectAttachmentPublic.model_validate(attachment) for attachment in project_attachments]
