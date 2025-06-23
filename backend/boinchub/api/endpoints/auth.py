# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Authentication endpoints for BoincHub."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from boinchub.core.security import (
    TokenResponse,
    create_token_pair,
    decode_token,
    extract_device_info,
    get_current_user_if_active,
)
from boinchub.core.settings import settings
from boinchub.core.utils import get_client_ip
from boinchub.models.user import User, UserPublic
from boinchub.models.user_session import UserSessionPublic
from boinchub.services.session_service import SessionService, get_session_service
from boinchub.services.user_service import UserService, get_user_service

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

# Cookie settings for refresh tokens
REFRESH_TOKEN_COOKIE_NAME = "refresh_token"  # noqa: S105
REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60


def set_refresh_token_cookie(response: Response, refresh_token: str) -> None:
    """Set the refresh token in a secure cookie.

    Args:
        response (Response): The HTTP response object.
        refresh_token (str): The refresh token to set in the cookie.

    """
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        max_age=REFRESH_TOKEN_COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.environment == "production",
        samesite="strict",
        path="/api/v1/auth",
    )


def clear_refresh_token_cookie(response: Response) -> None:
    """Clear the refresh token cookie.

    Args:
        response (Response): The HTTP response object.

    """
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        path="/api/v1/auth",
        secure=settings.environment == "production",
        samesite="strict",
    )


@router.post("/login")
async def login_for_access_token(
    response: Response,
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    user_service: Annotated[UserService, Depends(get_user_service)],
    session_service: Annotated[SessionService, Depends(get_session_service)],
) -> TokenResponse:
    """Generate access and refresh tokens for a user.

    Args:
        response (Response): The HTTP response object to set cookies.
        request (Request): The HTTP request object.
        form_data (OAuth2PasswordRequestForm): The form data containing username and password.
        user_service (UserService): The user service for database operations.
        session_service (SessionService): The session service for managing user sessions.

    Returns:
        TokenResponse: The access token and expiration information (refresh token set as cookie)

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

    # Extract device information
    user_agent = request.headers.get("user-agent", "Unknown")
    client_ip = request.client.host if request.client else "Unknown"

    device_info = extract_device_info(user_agent, client_ip)

    # Create session record
    _session, token_pair = session_service.create_session(
        user_id=user.id,
        device_name=device_info.get("device_name", "Unknown Device"),
        device_fingerprint=device_info.get("device_fingerprint", "Unknown Fingerprint"),
        user_agent=user_agent,
        ip_address=client_ip,
    )

    # Set refresh token as secure cookie
    set_refresh_token_cookie(response, token_pair.refresh_token)

    # Return only access token
    return TokenResponse(
        access_token=token_pair.access_token,
        token_type="bearer",  # noqa: S106
        expires_in=token_pair.expires_in,
    )


@router.post("/refresh")
async def refresh_access_token(
    response: Response,
    request: Request,
    session_service: Annotated[SessionService, Depends(get_session_service)],
    user_service: Annotated[UserService, Depends(get_user_service)],
    refresh_token: Annotated[str | None, Cookie(alias=REFRESH_TOKEN_COOKIE_NAME)] = None,
) -> TokenResponse:
    """Refresh the access token using the refresh token from cookies.

    Args:
        response (Response): The HTTP response object to set cookies.
        request (Request): The HTTP request object.
        session_service (SessionService): The session service for managing user sessions.
        user_service (UserService): The user service for database operations.
        refresh_token (str | None): The refresh token from the cookie.

    Returns:
        TokenResponse: The new access token and expiration information (refresh token updated in cookie)

    Raises:
        HTTPException: If the refresh token is invalid or expired.

    """
    # Validate refresh token and get session
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    session = session_service.get_session_by_refresh_token(refresh_token)

    if not session:
        clear_refresh_token_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Get user and validate they're still active
    user = user_service.get(session.user_id)

    if not user or not user.is_active:
        session_service.revoke_session(session.id)
        clear_refresh_token_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive")

    # Create new token pair
    token_pair = create_token_pair(user.id, session.id)

    # Update session access time, refresh token and IP
    client_ip = get_client_ip(request)
    session_service.update_session_access(session.id, token_pair.refresh_token, client_ip)

    # Update refresh token cookie with new token
    set_refresh_token_cookie(response, token_pair.refresh_token)

    # Return new access token
    return TokenResponse(
        access_token=token_pair.access_token,
        token_type="bearer",  # noqa: S106
        expires_in=token_pair.expires_in,
    )


@router.post("/logout")
async def logout(
    response: Response,
    session_service: Annotated[SessionService, Depends(get_session_service)],
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """Logout the current user session.

    Args:
        response (Response): The HTTP response object to clear cookies.
        session_service (SessionService): The session service for managing user sessions.
        authorization (str | None): The Authorization header containing the access token.

    Returns:
        dict[str, str]: A message indicating successful logout.

    Raises:
        HTTPException: If the Authorization header is missing or invalid.

    """
    # Validate the authorization header
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract session ID from access token
    try:
        # Extract token from header
        token = authorization.split(" ")[1]

        # Decode token to get session ID
        payload = decode_token(token)
        session_id = payload.get("session_id")

        if session_id:
            session_service.revoke_session(UUID(session_id))
    except Exception:  # noqa: BLE001, S110
        # Even if token processing fails, we should still clear the cookie
        pass

    # Clear the refresh token cookie
    clear_refresh_token_cookie(response)

    return {"message": "Successfully logged out"}


@router.get("/me")
async def get_current_user(
    current_user: Annotated[User, Depends(get_current_user_if_active)],
) -> UserPublic:
    """Get the currently authenticated user.

    Returns:
        UserPublic: The public representation of the current user.

    """
    return UserPublic.model_validate(current_user)


@router.post("/logout-all")
async def logout_all_sessions(
    current_user: Annotated[User, Depends(get_current_user_if_active)],
    session_service: Annotated[SessionService, Depends(get_session_service)],
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """Logout all user sessions except the current one.

    Args:
        current_user (User): The currently authenticated user.
        session_service (SessionService): The session service for managing user sessions.
        authorization (str | None): The Authorization header containing the access token.

    Returns:
        dict[str, str]: A message indicating successful logout of all sessions.

    Raises:
        HTTPException: If the Authorization header is missing or invalid.

    """
    # In theory, we'll never get to this point without an access token, but the type checker doesn't know that
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    current_session_id = None

    # Try to the extract the current session ID
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        current_session_id = payload.get("session_id")
    except Exception:  # noqa: BLE001, S110
        pass

    revoked_count = session_service.revoke_all_user_sessions(current_user.id, except_session_id=current_session_id)

    return {"message": f"Successfully logged out {revoked_count} other sessions"}


@router.get("/sessions")
async def get_user_sessions(
    current_user: Annotated[User, Depends(get_current_user_if_active)],
    authorization: Annotated[str | None, Header()] = None,
) -> list[UserSessionPublic]:
    """Get all active sessions for the current user.

    Args:
        current_user (User): The currently authenticated user.
        session_service (SessionService): The session service for managing user sessions.
        authorization (str | None): The Authorization header containing the access token.

    Returns:
        list[UserSessionPublic]: A list of active user sessions.

    Raises:
        HTTPException: If the Authorization header is missing or invalid.

    """
    # In theory, we'll never get to this point without an access token, but the type checker doesn't know that
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Try to identify current session
    current_session_id = None

    # Try to the extract the current session ID
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        current_session_id: UUID | None = payload.get("session_id")
    except Exception:  # noqa: BLE001, S110
        pass

    session_info = []

    for session in current_user.sessions:
        if session.is_active:
            session_public = UserSessionPublic.model_validate(session)
            session_public.is_current = str(session.id) == str(current_session_id)
            session_info.append(session_public)

    return session_info


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: UUID,
    current_user: Annotated[User, Depends(get_current_user_if_active)],
    session_service: Annotated[SessionService, Depends(get_session_service)],
) -> dict[str, str]:
    """Revoke a specific user session.

    Args:
        session_id (UUID): The ID of the session to revoke.
        current_user (User): The currently authenticated user.
        session_service (SessionService): The session service for managing user sessions.

    Returns:
        dict[str, str]: A message indicating successful revocation of the session.

    Raises:
        HTTPException: If the session does not belong to the current user or does not exist.

    """
    # Verify session belogns to the current user
    session = session_service.get_session_by_id_and_user(session_id, current_user.id)

    if not session or not session_service.revoke_session(session_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return {"message": "Session revoked successfully"}
