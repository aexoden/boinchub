# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Security and authentication module."""

import datetime
import hashlib
import secrets

from typing import Annotated, Any
from uuid import UUID

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
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
_password_hasher = PasswordHasher()


class TokenPair(SQLModel):
    """Model for access/refresh token pair response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"  # noqa: S105
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60


class TokenResponse(SQLModel):
    """Model for access token response."""

    access_token: str
    token_type: str = "bearer"  # noqa: S105
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60


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


def generate_refresh_token() -> str:
    """Generate a cryptographically secure refresh token.

    Returns:
        str: A securely generated refresh token.

    """
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token for secure storage.

    Args:
        token (str): The refresh token to hash.

    Returns:
        str: The hashed refresh token.

    """
    return hashlib.sha256(token.encode()).hexdigest()


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

    to_encode.update({"exp": expire, "iat": datetime.datetime.now(tz=datetime.UTC), "type": "access"})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_token_pair(user_id: UUID, session_id: UUID) -> TokenPair:
    """Create a complete access/refresh token pair.

    Args:
        user_id (UUID): The ID of the user.
        session_id (UUID): The ID of the user session.

    Returns:
        TokenPair: The generated token pair

    """
    # Create access token with user and session information
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user_id),
            "session_id": str(session_id),
        },
        expires_delta=access_token_expires,
    )

    # Generate refresh token
    refresh_token = generate_refresh_token()

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token.

    Args:
        token (str): The JWT token to decode.

    Returns:
        dict[str, Any]: The decoded token payload.

    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Annotated[Session, Depends(get_db)]) -> User:
    """Get the current user from a token.

    Args:
        token (str): The JWT access token.
        db (Session): The database session.

    Returns:
        User: The authenticated user.

    Raises:
        HTTPException: If the token is invalid or the user doesn't exist.

    """  # noqa: DOC502
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id: UUID | None = payload.get("sub")

        if not user_id:
            raise credentials_exception
    except (JWTError, ValueError) as e:
        raise credentials_exception from e

    # Import here to avoid circular dependency
    from boinchub.services.user_service import UserService  # noqa: PLC0415

    user_service = UserService(db)
    user = user_service.get(user_id)

    if user is None:
        raise credentials_exception

    return user


def get_current_user_if_active(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Get the current user if their account is active.

    Args:
        current_user (User): The current authenticated user.

    Returns:
        User: The authenticated user if their account is active.

    Raises:
        HTTPException: If the user's account is inactive.

    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return current_user


def extract_device_info(user_agent: str, client_ip: str) -> dict[str, str]:
    """Extract device information from request headers.

    Args:
        user_agent (str): The user agent string from the request.
        client_ip (str): The IP address of the client.

    Returns:
        dict[str, str]: A dictionary containing device information.

    """
    device_name = "Unknown Device"

    if "Mobile" in user_agent:
        device_name = "Mobile Device"
    elif "Tablet" in user_agent:
        device_name = "Tablet"
    elif "Windows" in user_agent:
        device_name = "Windows Computer"
    elif "Mac" in user_agent:
        device_name = "Mac Computer"
    elif "Linux" in user_agent:
        device_name = "Linux Computer"

    fingerprint_data = f"{user_agent}:{client_ip}"
    device_fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()

    return {
        "device_name": device_name,
        "device_fingerprint": device_fingerprint,
    }
