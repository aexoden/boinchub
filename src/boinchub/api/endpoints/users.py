# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for user management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from boinchub.core.auth import get_current_active_user, is_admin
from boinchub.core.database import get_db
from boinchub.models.user import User
from boinchub.services.user_service import UserCreate, UserService, UserUpdate

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"],
)


class UserResponse(BaseModel):
    """Response model for user data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    is_active: bool


class UserCreateResponse(BaseModel):
    """Response model for created user."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    is_active: bool


@router.post("/register")
def register_user(user_data: UserCreate, db: Annotated[Session, Depends(get_db)]) -> UserCreateResponse:
    """Register a new user.

    Args:
        user_data (UserCreate): The data for the new user.
        db (Session): The database session.

    Returns:
        UserCreateResponse: The created user's information.

    Raises:
        HTTPException: If the username already exists.
    """
    existing_user = UserService.get_user_by_username(db, user_data.username)

    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    user_data.role = "user"

    user = UserService.create_user(db, user_data)

    return UserCreateResponse.model_validate(user)


@router.get("/me")
def read_current_user(current_user: Annotated[User, Depends(get_current_active_user)]) -> UserResponse:
    """Get the current authenticated user.

    Args:
        current_user (User): The current authenticated user.

    Returns:
        UserResponse: The current user object.

    """
    return UserResponse.model_validate(current_user)


@router.patch("/me")
def update_current_user(
    user_data: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> UserResponse:
    """Update the current user's information.

    Args:
        user_data (UserUpdate): The data to update the user.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        UserResponse: The updated user information.

    Raises:
        HTTPException: If the user is not found.

    """
    if hasattr(user_data, "role"):
        user_data.role = None

    updated_user = UserService.update_user(db, current_user.id, user_data)

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(updated_user)


@router.get("")
def get_users(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> list[UserResponse]:
    """Get a list of users.

    Args:
        skip (int): The number of users to skip.
        limit (int): The maximum number of users to return.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        list[UserResponse]: A list of users.

    Raises:
        HTTPException: If the current user is not an admin.

    """
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    users = UserService.get_users(db, skip, limit)

    return [UserResponse.model_validate(user) for user in users]


@router.get("/{user_id}")
def get_user(
    user_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> UserResponse:
    """Get a user by ID.

    Args:
        user_id (int): The ID of the user.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        UserResponse: The user information.

    Raises:
        HTTPException: If the user is not found or if the current user is not an admin and not the requested user.

    """
    if not is_admin(current_user) and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user = UserService.get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(user)


@router.patch("/{user_id}")
def update_user(
    user_id: Annotated[int, Path(ge=1)],
    user_data: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> UserResponse:
    """Update a user by ID.

    Args:
        user_id (int): The ID of the user to update.
        user_data (UserUpdate): The data to update the user.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        UserResponse: The updated user information.

    Raises:
        HTTPException: If the user is not found or if the current user is not an admin and not the requested user.

    """
    if not is_admin(current_user):
        if current_user.id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if user_data.role is not None:
            user_data.role = None

    updated_user = UserService.update_user(db, user_id, user_data)

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(updated_user)


@router.delete("/{user_id}")
def delete_user(
    user_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> dict[str, str]:
    """Delete a user by ID.

    Args:
        user_id (int): The ID of the user to delete.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        dict[str, str]: A message indicating the user was deleted.

    Raises:
        HTTPException: If the user is not found or if the current user is not an admin.

    """
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    success = UserService.delete_user(db, user_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": "User deleted successfully"}
