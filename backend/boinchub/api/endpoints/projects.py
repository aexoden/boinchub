# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for project management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from boinchub.core.security import get_current_user_if_active
from boinchub.models.project import ProjectCreate, ProjectPublic, ProjectUpdate
from boinchub.models.project_attachment import ProjectAttachmentPublic
from boinchub.models.user import User
from boinchub.services.project_attachment_service import ProjectAttachmentService, get_project_attachment_service
from boinchub.services.project_service import ProjectService, get_project_service

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.post("")
def create_project(
    project_data: ProjectCreate,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ProjectPublic:
    """Create a new project.

    Args:
        project_data (ProjectCreate): The data for the new project.
        project_service (ProjectService): The service for project operations.
        current_user (User): The current authenticated user.

    Returns:
        ProjectPublic: The created project data.

    Raises:
        HTTPException: If a project with the same URL already exists or if the user is not an admin.

    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    if project_service.get_by_url(project_data.url) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project with this URL already exists.")

    project = project_service.create(project_data)

    return ProjectPublic.model_validate(project)


@router.get("")
def get_projects(
    *,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    enabled_only: bool = False,
) -> list[ProjectPublic]:
    """Get a list of projects.

    Args:
        project_service (ProjectService): The project service for database operations.
        current_user (User): The current authenticated user.
        offset (int): Number of projects to skip.
        limit (int): Maximum number of projects to return.
        enabled_only (bool): If True, only return enabled projects.

    Returns:
        list[ProjectPublic]: A list of projects.

    """
    # Only admins can see disabled projects
    if current_user.role != "admin":
        enabled_only = True

    if enabled_only:
        projects = project_service.get_enabled(offset, limit)
    else:
        projects = project_service.get_all(offset=offset, limit=limit)

    return [ProjectPublic.model_validate(project) for project in projects]


@router.get("/{project_id}")
def get_project(
    project_id: Annotated[UUID, Path()],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ProjectPublic:
    """Get a project by ID.

    Args:
        project_id (UUID): The ID of the project to retrieve.
        project_service (ProjectService): The project service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        ProjectPublic: The project data.

    Raises:
        HTTPException: If the project is not found or if the user does not have access.

    """
    project = project_service.get(project_id)

    if not project or (not project.enabled and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectPublic.model_validate(project)


@router.patch("/{project_id}")
def update_project(
    project_id: Annotated[UUID, Path()],
    project_data: ProjectUpdate,
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> ProjectPublic:
    """Update a project.

    Args:
        project_id (UUID): The ID of the project to update.
        project_data (ProjectUpdate): The data to update the project with.
        project_service (ProjectService): The project service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        ProjectPublic: The updated project data.

    Raises:
        HTTPException: If the project is not found or if the user is not an admin.

    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = project_service.update(project_id, project_data)

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectPublic.model_validate(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: Annotated[UUID, Path()],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> dict[str, str]:
    """Delete a project.

    Args:
        project_id (UUID): The ID of the project to delete.
        project_service (ProjectService): The project service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        dict: A message indicating the project was deleted.

    Raises:
        HTTPException: If the project is not found or if the user is not an admin.

    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    success = project_service.delete(project_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/project_attachments")
def get_project_attachments(
    project_id: Annotated[UUID, Path()],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    project_attachment_service: Annotated[ProjectAttachmentService, Depends(get_project_attachment_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> list[ProjectAttachmentPublic]:
    """Get all project attachments for a project.

    Args:
        project_id (int): The ID of the project.
        project_service (ProjectService): The service for project operations.
        project_attachment_service (ProjectAttachmentService): The service for project attachment operations.
        current_user (User): The current authenticated user.

    Returns:
        list[ProjectAttachmentPublic]: A list of project attachments.

    Raises:
        HTTPException: If the user is not an admin or if the project does not exist.

    """
    project = project_service.get(project_id)

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project_attachments = project_attachment_service.get_by_project(project_id)
    return [ProjectAttachmentPublic.model_validate(attachment) for attachment in project_attachments]
