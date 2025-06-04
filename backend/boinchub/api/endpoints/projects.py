# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for project management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from boinchub.core.auth import get_current_active_user, is_admin
from boinchub.core.database import get_db
from boinchub.models.user import User
from boinchub.services.project_service import ProjectCreate, ProjectService, ProjectUpdate

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


class ProjectResponse(BaseModel):
    """Response model for project data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    url: str
    signed_url: str
    description: str
    admin_notes: str
    enabled: bool


@router.post("")
def create_project(
    project_data: ProjectCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProjectResponse:
    """Create a new project.

    Args:
        project_data (ProjectCreate): The data for the new project.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        ProjectResponse: The created project data.

    Raises:
        HTTPException: If a project with the same URL already exists or if the user is not an admin.

    """
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    existing_project = ProjectService.get_project_by_url(db, project_data.url)
    if existing_project:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project with this URL already exists.")

    project = ProjectService.create_project(db, project_data)
    return ProjectResponse.model_validate(project)


@router.get("")
def get_projects(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    *,
    enabled_only: bool = False,
) -> list[ProjectResponse]:
    """Get a list of projects.

    Args:
        db (Session): The database session.
        current_user (User): The current authenticated user.
        skip (int): Number of projects to skip.
        limit (int): Maximum number of projects to return.
        enabled_only (bool): If True, only return enabled projects.

    Returns:
        list[ProjectResponse]: A list of projects.

    """
    if not is_admin(current_user):
        enabled_only = True

    projects = ProjectService.get_projects(db, skip, limit, enabled_only=enabled_only)
    return [ProjectResponse.model_validate(project) for project in projects]


@router.get("/{project_id}")
def get_project(
    project_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProjectResponse:
    """Get a project by its ID.

    Args:
        project_id (int): The ID of the project.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        ProjectResponse: The project data.

    Raises:
        HTTPException: If the project is not found or if the user is not an admin and the project is not enabled.

    """
    project = ProjectService.get_project(db, project_id)

    if not project or (not project.enabled and not is_admin(current_user)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectResponse.model_validate(project)


@router.put("/{project_id}")
def update_project(
    project_id: Annotated[int, Path(ge=1)],
    project_data: ProjectUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProjectResponse:
    """Update a project.

    Args:
        project_id (int): The ID of the project.
        project_data (ProjectUpdate): The data to update the project with.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        ProjectResponse: The updated project.

    Raises:
        HTTPException: If the project is not found or if the user is not an admin.

    """
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = ProjectService.update_project(db, project_id, project_data)

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> dict[str, str]:
    """Delete a project.

    Args:
        project_id (int): The ID of the project.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        dict: A message indicating the project was deleted.

    Raises:
        HTTPException: If the project is not found or if the user is not an admin.

    """
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    success = ProjectService.delete_project(db, project_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return {"message": "Project deleted successfully"}
