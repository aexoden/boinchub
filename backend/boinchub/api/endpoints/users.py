# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for user management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from boinchub.core.security import get_current_user_if_active
from boinchub.models.computer import ComputerPublic
from boinchub.models.user import User, UserCreate, UserPublic, UserUpdate
from boinchub.services.computer_service import ComputerService, get_computer_service
from boinchub.services.user_service import UserService, get_user_service

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/register")
def register_user(user_data: UserCreate, user_service: Annotated[UserService, Depends(get_user_service)]) -> UserPublic:
    """Register a new user.

    Args:
        user_data (UserCreate): The data for the new user.
        db (Session): The database session.

    Returns:
        UserPublic: The created user's information.

    Raises:
        HTTPException: If the username already exists.
    """
    if user_service.get_user_by_username(user_data.username) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is unavailable")

    # Always set the role to "user" for new registrations
    user_data.role = "user"

    user = user_service.create_user(user_data)

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

    """
    # Don't allow users to set their own role
    user_data.role = None

    updated_user = user_service.update_user(current_user.id, user_data)

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
    computers = computer_service.get_computers(current_user.id)
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
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    users = user_service.get_users(offset, limit)

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
        HTTPException: If the user doesn't exist or if the current user is not an admin and not the requested user.

    """
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user = user_service.get_user(user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserPublic.model_validate(user)


@router.patch("/{user_id}")
def update_user(
    user_id: Annotated[UUID, Path()],
    user_data: UserUpdate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> UserPublic:
    """Update a user by ID..

    Args:
        user_id (UUID): The ID of the user to update.
        user_data (UserUpdate): The data to update the user with.
        user_service (UserService): The user service for database operations.
        current_user (User): The current authenticated user.

    Returns:
        UserPublic: The updated user's information.

    Raises:
        HTTPException: If the user doesn't exist or if the current user is not an admin and not the requested user.

    """
    if current_user.role != "admin":
        # Don't allow non-admin users to update other users
        if current_user.id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Don't allow non-admin users to set their own role
        user_data.role = None

    updated_user = user_service.update_user(user_id, user_data)

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
        HTTPException: If the user is not found or if the current user is not an admin.

    """
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    success = user_service.delete_user(user_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": "User deleted successfully"}
