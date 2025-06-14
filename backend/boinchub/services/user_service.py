# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for user-related operations."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.core.security import hash_boinc_password, hash_password, verify_password
from boinchub.models.user import User, UserCreate, UserUpdate
from boinchub.services.base_service import BaseService


class UserService(BaseService[User, UserCreate, UserUpdate]):
    """Service for user-related operations."""

    model = User

    def authenticate_boinc_client(self, username: str, boinc_password_hash: str) -> User | None:
        """Authenticate a BOINC client.

        Args:
            username (str): The username of the user.
            boinc_password_hash (str): The password hash from the BOINC client.

        Returns:
            User | None: The authenticated user object or None if authentication fails.
        """
        user = self.get_by_username(username)

        if user and user.is_active and user.boinc_password_hash == boinc_password_hash:
            return user

        return None

    def authenticate(self, username: str, password: str) -> User | None:
        """Authenticate a user.

        Args:
            username (str): The username of the user.
            password (str): The password to authenticate.

        Returns:
            User | None: The authenticated user object or None if authentication fails.

        """
        user = self.get_by_username(username)

        if user and user.is_active and verify_password(password, user.password_hash):
            return user

        return None

    def create(self, object_data: UserCreate) -> User:
        """Create a new user.

        Args:
            object_data (UserCreate): The data for the new user.

        Returns:
            User: The created user object.

        """
        password_hash = hash_password(object_data.password)
        boinc_password_hash = hash_boinc_password(object_data.username, object_data.password)

        user_count = len(self.get_all())
        if user_count == 0 and object_data.role in {"admin", "user"}:
            object_data.role = "super_admin"

        user = User(
            username=object_data.username,
            password_hash=password_hash,
            boinc_password_hash=boinc_password_hash,
            email=object_data.email,
            role=object_data.role,
            is_active=object_data.is_active,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def get_by_username(self, username: str) -> User | None:
        """Get a user by username.

        Args:
            username (str): The username of the user.

        Returns:
            User | None: The user object if the user exists, None otherwise.

        """
        return self.db.exec(select(User).where(User.username == username)).first()

    def get_all(self, offset: int = 0, limit: int = 100, order_by: str | None = None, **filters: Any) -> list[User]:  # noqa: ANN401
        """Get a list of users.

        Args:
            offset (int): The number of users to skip.
            limit (int): The maximum number of users to return.
            order_by (str | None): The field to order the results by. Defaults to "username".
            **filters: Additional filters to apply to the query.

        Returns:
            list[User]: A list of user objects.

        """
        return super().get_all(offset=offset, limit=limit, order_by=order_by or "username", **filters)

    def update(self, object_id: UUID, object_data: UserUpdate, current_user: User | None = None) -> User | None:  # noqa: C901, PLR0912
        """Update a user.

        Args:
            object_id (UUID): The ID of the user to update.
            object_data (UserUpdate): The data to update the user with.
            current_user (User | None): The current user performing the update. Defaults to None.

        Returns:
            User | None: The updated user object if the user exists, None otherwise.

        Raises:
            HTTPException: If the current user is not authorized to update the user.

        """
        user = self.get(object_id)

        if not user:
            return None

        if current_user and not current_user.can_modify_user(user):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if (
            current_user
            and object_data.role is not None
            and object_data.role != user.role
            and not current_user.can_change_role(user)
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Check if this is a self-update
        is_self_update = current_user and current_user.id == user.id

        # If user is changing their own password, require current password verification
        if is_self_update and object_data.password and not object_data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to change your own password",
            )

        # If the current password is provided, verify it
        password_verified = False

        if object_data.current_password:
            if not verify_password(object_data.current_password, user.password_hash):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
            password_verified = True

        if object_data.username and object_data.username != user.username:
            # If changing username, ensure the current password is correct or a new password is provided
            if not object_data.current_password and not object_data.password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is required to change username"
                )

            existing_user = self.get_by_username(object_data.username)

            if existing_user and existing_user.id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")

        update_data = object_data.model_dump(exclude_none=True)

        # Handle username changes
        username_changed = False

        if "username" in update_data and update_data["username"] != user.username:
            existing_user = self.get_by_username(update_data["username"])
            if existing_user and existing_user.id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")
            username_changed = True

        # Handle password changes
        password_changed = False

        if "password" in update_data:
            password = update_data.pop("password")
            update_data["password_hash"] = hash_password(password)
            password_changed = True

        # Recalculate BOINC password hash if username or password changed
        if username_changed or password_changed:
            new_username = update_data.get("username", user.username)

            if password_changed and object_data.password:
                update_data["boinc_password_hash"] = hash_boinc_password(new_username, object_data.password)
            elif password_verified and object_data.current_password:
                update_data["boinc_password_hash"] = hash_boinc_password(new_username, object_data.current_password)
            else:
                # A password is required to recalculate the BOINC password hash
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username changes require a password to be provided to maintain BOINC compatibility",
                )

        user.sqlmodel_update(update_data)

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user


def get_user_service(db: Annotated[Session, Depends(get_db)]) -> UserService:
    """FastAPI function to get an instance of UserService.

    Args:
        db (Session): The database session to use.

    Returns:
        UserService: An instance of UserService.

    """
    return UserService(db)
