# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Authentication endpoints for BoincHub."""

import datetime

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from boinchub.core.auth import ACCESS_TOKEN_EXPIRE_MINUTES, Token, authenticate_user, create_access_token
from boinchub.core.database import get_db

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["authentication"],
)


@router.post("/login")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Annotated[Session, Depends(get_db)]
) -> Token:
    """Generate a token for a user.

    Args:
        from_data (OAuth2PasswordRequestForm): The form data containing username and password.
        db (Session): The database session.

    Returns:
        Token: The generated token.

    Raises:
        HTTPException: If authentication fails.

    """
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)

    return Token(access_token=access_token, token_type="bearer")  # noqa: S106
