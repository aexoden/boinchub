# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Authentication endpoints for BoincHub."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from boinchub.core.security import (
    RefreshTokenRequest,
    TokenPair,
    create_token_pair,
    decode_token,
    extract_device_info,
    get_current_user_if_active,
)
from boinchub.models.user import User
from boinchub.models.user_session import UserSessionPublic
from boinchub.services.session_service import SessionService, get_session_service
from boinchub.services.user_service import UserService, get_user_service

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/login")
async def login_for_access_token(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    user_service: Annotated[UserService, Depends(get_user_service)],
    session_service: Annotated[SessionService, Depends(get_session_service)],
) -> TokenPair:
    """Generate access and refresh tokens for a user.

    Args:
        request (Request): The HTTP request object.
        form_data (OAuth2PasswordRequestForm): The form data containing username and password.
        user_service (UserService): The user service for database operations.
        session_service (SessionService): The session service for managing user sessions.

    Returns:
        TokenPair: The generated access and refresh tokens.

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

    return token_pair


@router.post("/refresh")
async def refresh_access_token(
    request: Request,
    refresh_request: RefreshTokenRequest,
    session_service: Annotated[SessionService, Depends(get_session_service)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> TokenPair:
    """Refresh the access token using a valid refresh token.

    Args:
        request (Request): The HTTP request object.
        refresh_request (RefreshTokenRequest): The request containing the refresh token.
        session_service (SessionService): The session service for managing user sessions.
        user_service (UserService): The user service for database operations.

    Returns:
        TokenPair: The new access and refresh tokens.

    Raises:
        HTTPException: If the refresh token is invalid or expired.

    """
    # Validate refersh token and get session
    session = session_service.get_session_by_refresh_token(refresh_request.refresh_token)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Get user and validate they're still active
    user = user_service.get(session.user_id)

    if not user or not user.is_active:
        session_service.revoke_session(session.id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive")

    # Create new token pair
    token_pair = create_token_pair(user.id, session.id)

    # Update session access time, refresh token and IP
    client_ip = request.client.host if request.client else session.ip_address
    session_service.update_session_access(session.id, token_pair.refresh_token, client_ip)

    return token_pair


@router.post("/logout")
async def logout(
    _current_user: Annotated[User, Depends(get_current_user_if_active)],
    session_service: Annotated[SessionService, Depends(get_session_service)],
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """Logout the current user session.

    Args:
        current_user (User): The currently authenticated user.
        session_service (SessionService): The session service for managing user sessions.
        authorization (str | None): The Authorization header containing the access token.

    Returns:
        dict[str, str]: A message indicating successful logout.

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

    # Extract session ID from access token
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        session_id = payload.get("session_id")

        if session_id:
            session_service.revoke_session(session_id)
    except Exception:  # noqa: BLE001, S110
        # Even if we can't decode the token, still return success
        pass

    return {"message": "Successfully logged out"}


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
