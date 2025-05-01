# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for user management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from boinchub.core.database import get_db
from boinchub.services.user_service import UserCreate, UserService

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


@router.post("/register")
def register_user(user_data: UserCreate, db: Annotated[Session, Depends(get_db)]) -> UserResponse:
    """Register a new user.

    Args:
        user_data (UserCreate): The data for the new user.
        db (Session): The database session.

    Returns:
        UserResponse: The created user object.

    Raises:
        HTTPException: If the username already exists.
    """
    existing_user = UserService.get_user_by_username(db, user_data.username)

    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = UserService.create_user(db, user_data)

    return UserResponse.model_validate(user)
