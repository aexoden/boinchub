# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""API endpoints for computer management."""

import datetime

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from boinchub.core.auth import get_current_active_user, user_has_access_to_computer
from boinchub.core.database import get_db
from boinchub.models.computer import Computer
from boinchub.models.user import User

router = APIRouter(prefix="/api/v1/computers", tags=["computers"])


class ComputerResponse(BaseModel):
    """Response model for computer data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: UUID
    cpid: str
    domain_name: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


@router.get("")
def get_user_computers(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> list[ComputerResponse]:
    """Get all computers for the current user.

    Args:
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        list[ComputerResponse]: List of computers associated with the user.
    """
    computers = db.query(Computer).filter(Computer.user_id == current_user.id).all()
    return [ComputerResponse.model_validate(computer) for computer in computers]


@router.get("/{computer_id}")
def get_computer(
    computer_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ComputerResponse:
    """Get a specific computer by ID.

    Args:
        computer_id (int): The ID of the computer to retrieve.
        db (Session): The database session.
        current_user (User): The current authenticated user.

    Returns:
        ComputerResponse: The requested computer data.

    Raises:
        HTTPException: If the computer does not exist or the user does not have access.
    """
    if not user_has_access_to_computer(db, current_user, computer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found")

    computer = db.query(Computer).filter(Computer.id == computer_id).first()

    if not computer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Computer not found.")

    return ComputerResponse.model_validate(computer)
