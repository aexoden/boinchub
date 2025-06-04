# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Authentication module for BoincHub."""

import datetime

from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from boinchub.core.database import get_db
from boinchub.core.settings import settings
from boinchub.models.computer import Computer
from boinchub.models.user import User
from boinchub.services.user_service import UserService

# JWT token settings
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class Token(BaseModel):
    """Model for token response."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Model for token data."""

    username: str | None = None


def create_access_token(data: dict[str, Any], expires_delta: datetime.timedelta | None = None) -> str:
    """Create a JWT access token.

    Args:
        data (dict[str, str]): The data to include in the token.
        expires_delta (datetime.timedelta | None): The expiration time delta.

    Returns:
        str: The generated JWT access token.

    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.datetime.now(tz=datetime.UTC) + expires_delta
    else:
        expire = datetime.datetime.now(tz=datetime.UTC) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Annotated[Session, Depends(get_db)]) -> User:
    """Get the current user from the token.

    Args:
        token (str): The JWT access token.
        db (Session): The database session.

    Returns:
        User: The authenticated user.

    Raises:
        HTTPException: If the token is invalid or the user does not exist.

    """  # noqa: DOC502
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if not isinstance(username, str):
            raise credentials_exception

        token_data = TokenData(username=username)
    except JWTError as e:
        raise credentials_exception from e

    user = UserService.get_user_by_username(db, token_data.username) if token_data.username else None

    if user is None:
        raise credentials_exception

    return user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    """Authenticate a user.

    Args:
        db (Session): The database session.
        username (str): The username of the user.
        password (str): The password of the user.

    Returns:
        User | None: The authenticated user or None if authentication fails.

    """
    return UserService.authenticate_user(db, username, password)


def is_admin(user: User) -> bool:
    """Check if the user is an admin.

    Args:
        user (User): The user to check.

    Returns:
        bool: True if the user is an admin, False otherwise.

    """
    return user.role == "admin"


def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Get the current active user.

    Args:
        current_user (User): The current user.

    Returns:
        User: The active user.

    Raises:
        HTTPException: If the user is inactive.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


def user_has_access_to_computer(db: Session, user: User, computer_id: int) -> bool:
    """Check if the user has access to the computer.

    Args:
        db (Session): The database session.
        user (User): The user to check.
        computer_id (int): The ID of the computer.

    Returns:
        bool: True if the user has access, False otherwise.

    """
    if is_admin(user):
        return True

    computer = db.query(Computer).filter(Computer.id == computer_id).first()

    if not computer:
        return False

    return computer.user_id == user.id
