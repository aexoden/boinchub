# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Security and authentication module."""

import datetime
import hashlib

from typing import Annotated, Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session, SQLModel

from boinchub.core.database import get_db
from boinchub.core.settings import settings
from boinchub.models.user import User

# Configuration
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
_password_hasher = PasswordHasher()


class Token(SQLModel):
    """Model for JWT token response."""

    access_token: str
    token_type: str


def hash_password(password: str) -> str:
    """Hash a password using Argon2.

    Args:
        password (str): The password to hash.

    Returns:
        The hashed password.

    """
    return _password_hasher.hash(password)


def hash_boinc_password(username: str, password: str) -> str:
    """Hash a password for BOINC protocol compatibility.

    Args:
        username (str): The username of the user.
        password (str): The password to hash.

    Returns:
        The MD5 hashed password required by the BOINC protocol.

    """
    return hashlib.md5(f"{password}{username.lower()}".encode()).hexdigest()  # noqa: S324


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a hashed password.

    Args:
        password (str): The password to verify.
        password_hash (str): The hashed password to verify against.

    Returns:
        bool: True if the password matches the hash, False otherwise.

    """
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(data: dict[str, Any], expires_delta: datetime.timedelta | None = None) -> str:
    """Create a JWT access token.

    Args:
        data (dict[str, str]): The data to include in the token.
        expires_delta: datetime.timedelta | None: The expiration time delta.

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
    """Get the current user from a token.

    Args:
        token (str): The JWT access token.
        db (Session): The database session.

    Returns:
        user: The authenticated user.

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
    except JWTError as e:
        raise credentials_exception from e

    # Import here to avoid circular dependency
    from boinchub.services.user_service import UserService  # noqa: PLC0415

    user_service = UserService(db)
    user = user_service.get_user_by_username(username)

    if user is None:
        raise credentials_exception

    return user


def get_current_user_if_active(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Get the current user if they are active.

    Args:
        current_user (User): The current user.

    Returns:
        User: The user object if the user is active.

    Raises:
        HTTPException: If the user is inactive.

    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return current_user
