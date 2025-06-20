# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for user management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from boinchub.core.security import get_current_user_if_active
from boinchub.core.settings import settings
from boinchub.models.computer import ComputerPublic
from boinchub.models.user import User, UserCreate, UserPublic, UserUpdate
from boinchub.services.computer_service import ComputerService, get_computer_service
from boinchub.services.invite_code_service import InviteCodeService, get_invite_code_service
from boinchub.services.user_service import UserService, get_user_service

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/register")
def register_user(
    user_data: UserCreate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    invite_code_service: Annotated[InviteCodeService, Depends(get_invite_code_service)],
) -> UserPublic:
    """Register a new user.

    Args:
        user_data (UserCreate): The data for the new user.
        user_service (UserService): The service for managing users.
        invite_code_service (InviteCodeService): The service for managing invite codes.

    Returns:
        UserPublic: The created user's information.

    Raises:
        HTTPException: If the username already exists.
    """
    # Validate the invite code if enabled
    if settings.require_invite_code and (
        not user_data.invite_code or not invite_code_service.validate(user_data.invite_code)
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invite code")

    if user_service.get_by_username(user_data.username) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is unavailable")

    # Always set the role to "user" for new registrations
    user_data.role = "user"

    user = user_service.create(user_data)

    if settings.require_invite_code and user_data.invite_code:
        invite_code_service.use(user_data.invite_code, user)

    return UserPublic.model_validate(user)


@router.get("/me")
def read_current_user(current_user: Annotated[User, Depends(get_current_user_if_active)]) -> UserPublic:
    """Get the current authenticated user.

    Args:
        current_user (User): The current authenticated user.

    Returns:
        UserPublic: The current user object.

    """
    return UserPublic.model_validate(current_user)


@router.patch("/me")
def update_current_user(
    user_data: UserUpdate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> UserPublic:
    """Update the current user's information.

    Args:
        user_data (UserUpdate): The data to update the user with.
        user_service (UserService): The user service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        UserPublic: The updated user information.

    Raises:
        HTTPException: If the user is not updated.

    """
    # Don't allow users to set their own role
    user_data.role = None

    updated_user = user_service.update(current_user.id, user_data)

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserPublic.model_validate(updated_user)


@router.get("/me/computers")
def get_computers_for_user(
    computer_service: Annotated[ComputerService, Depends(get_computer_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> list[ComputerPublic]:
    """Get all computers for the current user.

    Args:
        computer_service (ComputerService): The service for computer operations.
        current_user (User): The current authenticated user.

    Returns:
        list[ComputerPublic]: List of computers associated with the user.

    """
    computers = computer_service.get_all(user_id=current_user.id)
    return [ComputerPublic.model_validate(computer) for computer in computers]


@router.get("")
def get_users(
    user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> list[UserPublic]:
    """Get a list of all users.

    Args:
        user_service (UserService): The user service for database operations.

    Returns:
        list[UserPublic]: A list of user objects.

    Raises:
        HTTPException: If the current user is not an admin.

    """
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    users = user_service.get_all(offset, limit)

    return [UserPublic.model_validate(user) for user in users]


@router.get("/{user_id}")
def get_user(
    user_id: Annotated[UUID, Path()],
    user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> UserPublic:
    """Get a user by ID.

    Args:
        user_id (UUID): The ID of the user.
        user_service (UserService): The user service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        UserPublic: The user's information.

    Raises:
        HTTPException: If the user doesn't exist or if the current user doesn't have permissions

    """
    user = user_service.get(user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not current_user.can_modify_user(user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserPublic.model_validate(user)


@router.patch("/{user_id}")
def update_user(
    user_id: Annotated[UUID, Path()],
    user_data: UserUpdate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> UserPublic:
    """Update a user by ID.

    Args:
        user_id (UUID): The ID of the user to update.
        user_data (UserUpdate): The data to update the user with.
        user_service (UserService): The user service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        UserPublic: The updated user's information.

    Raises:
        HTTPException: If the user doesn't exist or if permissions are insufficient.

    """
    target_user = user_service.get(user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_data.username and user_data.username != target_user.username and not user_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be provided when changing username to maintain BOINC compatibility",
        )

    updated_user = user_service.update(user_id, user_data, current_user)

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserPublic.model_validate(updated_user)


@router.delete("/{user_id}")
def delete_user(
    user_id: Annotated[UUID, Path()],
    user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> dict[str, str]:
    """Delete a user by ID.

    Args:
        user_id (UUID): The ID of the user to delete.
        user_service (UserService): The user service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        dict[str, str]: A message indicating the user was deleted.

    Raises:
        HTTPException: If the user is not found or if permisisons are insufficient.

    """
    target_user = user_service.get(user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not current_user.can_modify_user(target_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent deletion of the last super admin
    if target_user.role == "super_admin":
        super_admins = user_service.get_all(role="super_admin")
        if len(super_admins) <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete the last super admin")

    success = user_service.delete(user_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": "User deleted successfully"}
