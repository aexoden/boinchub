# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for invite code management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from boinchub.core.security import get_current_user_if_active
from boinchub.models.invite_code import InviteCodeCreate, InviteCodePublic, InviteCodeUpdate
from boinchub.models.user import User
from boinchub.services.invite_code_service import InviteCodeService, get_invite_code_service

router = APIRouter(prefix="/api/v1/invite_codes", tags=["invite_codes"])


@router.post("")
def create_invite_code(
    invite_code_data: InviteCodeCreate,
    invite_code_service: Annotated[InviteCodeService, Depends(get_invite_code_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> InviteCodePublic:
    """Create a new invite code.

    Args:
        invite_code_data (InviteCodeCreate): The data for the invite code to create.
        invite_code_service (InviteCodeService): The service for managing invite codes.
        current_user (User): The currently authenticated user.

    Returns:
        InviteCodePublic: The created invite code.

    Raises:
        HTTPException: If the user is not an admin or if the code already exists.

    """
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create invite codes.",
        )

    invite_code = invite_code_service.create_with_user(invite_code_data, current_user)

    invite_code_public = InviteCodePublic.model_validate(invite_code)
    invite_code_public.created_by_username = current_user.username

    return invite_code_public


@router.get("")
def get_invite_codes(
    *,
    invite_code_service: Annotated[InviteCodeService, Depends(get_invite_code_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    active_only: bool = False,
) -> list[InviteCodePublic]:
    """Get a list of invite codes.

    Args:
        invite_code_service (InviteCodeService): The service for managing invite codes.
        current_user (User): The currently authenticated user.
        offset (int): The number of records to skip.
        limit (int): The maximum number of records to return.
        active_only (bool): Whether to return only active invite codes.

    Returns:
        list[InviteCodePublic]: A list of invite codes.

    Raises:
        HTTPException: If the user is not an admin.

    """
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    filters = {}

    if active_only:
        filters["is_active"] = True

    invite_codes = invite_code_service.get_all(offset=offset, limit=limit, **filters)

    return [
        InviteCodePublic(
            **code.model_dump(),
            created_by_username=code.created_by.username if code.created_by else None,
            used_by_username=code.used_by.username if code.used_by else None,
        )
        for code in invite_codes
    ]


@router.get("/{invite_code_id}")
def get_invite_code(
    invite_code_id: Annotated[UUID, Path()],
    invite_code_service: Annotated[InviteCodeService, Depends(get_invite_code_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> InviteCodePublic:
    """Get an invite code by ID.

    Args:
        invite_code_id (UUID): The ID of the invite code to retrieve.
        invite_code_service (InviteCodeService): The service for managing invite codes.
        current_user (User): The currently authenticated user.

    Returns:
        InviteCodePublic: The invite code with additional user information.

    Raises:
        HTTPException: If the user is not an admin or if the invite code does not exist.

    """
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    invite_code = invite_code_service.get(invite_code_id)

    if not invite_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found")

    return InviteCodePublic(
        **invite_code.model_dump(),
        created_by_username=invite_code.created_by.username if invite_code.created_by else None,
        used_by_username=invite_code.used_by.username if invite_code.used_by else None,
    )


@router.patch("/{invite_code_id}")
def update_invite_code(
    invite_code_id: Annotated[UUID, Path()],
    invite_code_data: InviteCodeUpdate,
    invite_code_service: Annotated[InviteCodeService, Depends(get_invite_code_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> InviteCodePublic:
    """Update an existing invite code.

    Args:
        invite_code_id (UUID): The ID of the invite code to update.
        invite_code_data (InviteCodeUpdate): The data to update the invite code with.
        invite_code_service (InviteCodeService): The service for managing invite codes.
        current_user (User): The currently authenticated user.

    Returns:
        InviteCodePublic: The updated invite code.

    Raises:
        HTTPException: If the user is not an admin or if the invite code does not exist.

    """
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    updated_invite_code = invite_code_service.update(invite_code_id, invite_code_data)

    if not updated_invite_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found")

    return InviteCodePublic(
        **updated_invite_code.model_dump(),
        created_by_username=updated_invite_code.created_by.username if updated_invite_code.created_by else None,
        used_by_username=updated_invite_code.used_by.username if updated_invite_code.used_by else None,
    )


@router.delete("/{invite_code_id}")
def delete_invite_code(
    invite_code_id: Annotated[UUID, Path()],
    invite_code_service: Annotated[InviteCodeService, Depends(get_invite_code_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> dict[str, str]:
    """Delete an invite code.

    Args:
        invite_code_id (UUID): The ID of the invite code to delete.
        invite_code_service (InviteCodeService): The service for managing invite codes.
        current_user (User): The currently authenticated user.

    Returns:
        dict[str, str]: A confirmation message indicating the invite code was deleted.

    Raises:
        HTTPException: If the user is not an admin or if the invite code does not exist.

    """
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    if not invite_code_service.delete(invite_code_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found")

    return {"message": "Invite code deleted successfully"}
