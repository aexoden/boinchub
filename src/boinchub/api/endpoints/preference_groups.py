# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for preference group management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from boinchub.core.security import get_current_user_if_active
from boinchub.models.preference_group import PreferenceGroupCreate, PreferenceGroupPublic, PreferenceGroupUpdate
from boinchub.models.user import User
from boinchub.services.preference_group_service import PreferenceGroupService, get_preference_group_service

router = APIRouter(prefix="/api/v1/preference_groups", tags=["preference_groups"])


@router.post("")
def create_preference_group(
    preference_group_data: PreferenceGroupCreate,
    preference_group_service: Annotated[PreferenceGroupService, Depends(get_preference_group_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> PreferenceGroupPublic:
    """Create a new preference group.

    Args:
        preference_group_data (PreferenceGroupCreate): The data for the new preference group.
        preference_group_service (PreferenceGroupService): The service for preference group operations.
        current_user (User): The current authenticated user.

    Returns:
        PreferenceGroupPublic: The created preference group.

    """
    # Non-admin users can only create preference groups for themselves
    if current_user.role not in {"admin", "super_admin"}:
        preference_group_data.user_id = current_user.id

    preference_group = preference_group_service.create(preference_group_data)
    return PreferenceGroupPublic.model_validate(preference_group)


@router.get("")
def get_preference_groups(
    *,
    preference_group_service: Annotated[PreferenceGroupService, Depends(get_preference_group_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    scope: Annotated[str, Query()] = "available",
) -> list[PreferenceGroupPublic]:
    """Get a list of preference groups.

    Args:
        preference_group_service (PreferenceGroupService): The service for preference group operations.
        current_user (User): The current authenticated user.
        offset (int): The number of preference groups to skip.
        limit (int): The maximum number of preference groups to return.
        scope (str): Scope filter - "available" (default), "global", "personal", or "all" (admin only).

    Returns:
        list[PreferenceGroupPublic]: A list of preference groups.

    Raises:
        HTTPException: If the user does not have permission to access the requested scope.

    """
    if scope == "all":
        if current_user.role not in {"admin", "super_admin"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )

        preference_groups = preference_group_service.get_all(offset=offset, limit=limit)
    elif scope == "global":
        preference_groups = preference_group_service.get_all(offset=offset, limit=limit, user_id=None)
    elif scope == "personal":
        preference_groups = preference_group_service.get_all(offset=offset, limit=limit, user_id=current_user.id)
    elif scope == "available":
        preference_groups = preference_group_service.get_available_for_user(current_user.id, offset=offset, limit=limit)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scope: {scope}",
        )

    return [PreferenceGroupPublic.model_validate(pg) for pg in preference_groups]


@router.get("/{preference_group_id}")
def get_preference_group(
    preference_group_id: Annotated[UUID, Path()],
    preference_group_service: Annotated[PreferenceGroupService, Depends(get_preference_group_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> PreferenceGroupPublic:
    """Get a preference group by ID.

    Args:
        preference_group_id (UUID): The ID of the preference group to retrieve.
        preference_group_service (PreferenceGroupService): The service for preference group operations.
        current_user (User): The current authenticated user.

    Returns:
        PreferenceGroupPublic: The requested preference group.

    Raises:
        HTTPException: If the preference group does not exist or the user does not have access.
    """
    preference_group = preference_group_service.get(preference_group_id)

    if not preference_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference group not found",
        )

    if (
        preference_group.user_id is not None
        and preference_group.user_id != current_user.id
        and current_user.role not in {"admin", "super_admin"}
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference group not found",
        )

    return PreferenceGroupPublic.model_validate(preference_group)


@router.patch("/{preference_group_id}")
def update_preference_group(
    preference_group_id: Annotated[UUID, Path()],
    preference_group_data: PreferenceGroupUpdate,
    preference_group_service: Annotated[PreferenceGroupService, Depends(get_preference_group_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> PreferenceGroupPublic:
    """Update an existing preference group.

    Args:
        preference_group_id (UUID): The ID of the preference group to update.
        preference_group_data (PreferenceGroupUpdate): The updated data for the preference group.
        preference_group_service (PreferenceGroupService): The service for preference group operations.
        current_user (User): The current authenticated user.

    Returns:
        PreferenceGroupPublic: The updated preference group.

    Raises:
        HTTPException: If the preference group does not exist or the user does not have access.

    """
    preference_group = preference_group_service.get(preference_group_id)

    if not preference_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference group not found",
        )

    if current_user.role not in {"admin", "super_admin"} and preference_group.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference group not found",
        )

    updated_preference_group = preference_group_service.update(preference_group_id, preference_group_data)
    return PreferenceGroupPublic.model_validate(updated_preference_group)


@router.delete("/{preference_group_id}")
def delete_preference_group(
    preference_group_id: Annotated[UUID, Path()],
    preference_group_service: Annotated[PreferenceGroupService, Depends(get_preference_group_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> dict[str, str]:
    """Delete a preference group.

    Args:
        preference_group_id (UUID): The ID of the preference group to delete.
        preference_group_service (PreferenceGroupService): The service for preference group operations.
        current_user (User): The current authenticated user.

    Returns:
        dict[str, str]: A success message indicating the preference group was deleted.

    Raises:
        HTTPException: If the preference group does not exist or the user does not have access.

    """
    preference_group = preference_group_service.get(preference_group_id)

    if not preference_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference group not found",
        )

    if current_user.role not in {"admin", "super_admin"} and preference_group.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference group not found",
        )

    success = preference_group_service.delete(preference_group_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference group not found",
        )

    return {"message": "Preference group deleted successfully"}
