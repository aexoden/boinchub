# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Authentication endpoints for BoincHub."""

import datetime

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from boinchub.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, Token, create_access_token
from boinchub.services.user_service import UserService, get_user_service

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/login")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> Token:
    """Generate a token for a user.

    Args:
        form_data (OAuth2PasswordRequestForm): The form data containing username and password.
        user_service (UserService): The user service for database operations.

    Returns:
        Token: The generated token.

    Raises:
        HTTPException: If authentication fails.

    """
    user = user_service.authenticate(form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)

    return Token(access_token=access_token, token_type="bearer")  # noqa: S106
