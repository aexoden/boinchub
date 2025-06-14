# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for user project key management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel

from boinchub.core.security import get_current_user_if_active
from boinchub.models.user import User
from boinchub.models.user_project_key import UserProjectKeyPublic
from boinchub.services.project_service import ProjectService, get_project_service
from boinchub.services.user_project_key_service import UserProjectKeyService, get_user_project_key_service

router = APIRouter(prefix="/api/v1/user_project_keys", tags=["user_project_keys"])


class UserProjectKeyRequest(BaseModel):
    """Request model for creating/updating user project keys."""

    project_id: UUID
    account_key: str


class UserProjectKeyWithProject(UserProjectKeyPublic):
    """User project key response with project details."""

    project_name: str
    project_url: str


@router.get("/me")
def get_current_user_project_keys(
    user_project_key_service: Annotated[UserProjectKeyService, Depends(get_user_project_key_service)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> list[UserProjectKeyWithProject]:
    """Get all project keys for the current user.

    Args:
        user_project_key_service (UserProjectKeyService): The service for user project key operations.
        project_service (ProjectService): The service for project operations.
        current_user (User): The current authenticated user.

    Returns:
        list[UserProjectKeyWithProject]: A list of user project keys with project details.

    """
    user_keys = user_project_key_service.get_by_user(current_user.id)

    enriched_keys = []

    for user_key in user_keys:
        project = project_service.get(user_key.project_id)

        if project:
            enriched_key = UserProjectKeyWithProject(
                **user_key.model_dump(),
                project_name=project.name,
                project_url=project.url,
            )

            enriched_keys.append(enriched_key)

    return enriched_keys


@router.post("/me")
def create_or_update_user_project_key(
    key_request: UserProjectKeyRequest,
    user_project_key_service: Annotated[UserProjectKeyService, Depends(get_user_project_key_service)],
    project_service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> UserProjectKeyPublic:
    """Create or update a project key for the current user.

    Args:
        key_request (UserProjectKeyRequest): The request data for creating/updating the project key.
        user_project_key_service (UserProjectKeyService): The service for user project key operations.
        project_service (ProjectService): The service for project operations.
        current_user (User): The current authenticated user.

    Returns:
        UserProjectKeyPublic: The created or updated user project key.

    Raises:
        HTTPException: If the project is not found or if the user does not have access to the project.

    """
    project = project_service.get(key_request.project_id)

    if not project or not project.enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found or disabled")

    if not key_request.account_key.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account key cannot be empty")

    user_key = user_project_key_service.create_or_update_by_user_project(
        user_id=current_user.id,
        project_id=key_request.project_id,
        account_key=key_request.account_key.strip(),
    )

    return UserProjectKeyPublic.model_validate(user_key)


@router.delete("/me/{project_id}")
def delete_user_project_key(
    project_id: Annotated[UUID, Path()],
    user_project_key_service: Annotated[UserProjectKeyService, Depends(get_user_project_key_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> dict[str, str]:
    """Delete a project key for the current user.

    Args:
        project_id (UUID): The ID of the project to delete the key for.
        user_project_key_service (UserProjectKeyService): The service for user project key operations.
        current_user (User): The current authenticated user.

    Returns:
        dict[str, str]: A message indicating the result of the deletion.

    Raises:
        HTTPException: If the project key does not exist.

    """
    success = user_project_key_service.delete_by_user_project(current_user.id, project_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project key not found")

    return {"message": "Project key deleted successfully"}


@router.get("")
def get_all_user_project_keys(
    user_project_key_service: Annotated[UserProjectKeyService, Depends(get_user_project_key_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> list[UserProjectKeyPublic]:
    """Get all project keys.

    Args:
        user_project_key_service (UserProjectKeyService): The service for user project key operations.
        current_user (User): The current authenticated user.

    Returns:
        list[UserProjectKeyWithProject]: A list of user project keys.

    Raises:
        HTTPException: If the user is not an admin.

    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    user_keys = user_project_key_service.get_all()
    return [UserProjectKeyPublic.model_validate(user_key) for user_key in user_keys]
