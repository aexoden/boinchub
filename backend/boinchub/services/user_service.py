# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for user-related operations."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.core.security import hash_boinc_password, hash_password, verify_password
from boinchub.models.user import User, UserCreate, UserUpdate


class UserService:
    """Service for user-related operations."""

    def __init__(self, db: Session) -> None:
        """Initialize the UserService with a database session."""
        self.db = db

    def authenticate_boinc_client(self, username: str, boinc_password_hash: str) -> User | None:
        """Authenticate a BOINC client.

        Args:
            username (str): The username of the user.
            boinc_password_hash (str): The password hash from the BOINC client.

        Returns:
            User | None: The authenticated user object or None if authentication fails.
        """
        user = self.get_user_by_username(username)

        if user and user.is_active and user.boinc_password_hash == boinc_password_hash:
            return user

        return None

    def authenticate_user(self, username: str, password: str) -> User | None:
        """Authenticate a user.

        Args:
            username (str): The username of the user.
            password (str): The password to authenticate.

        Returns:
            User | None: The authenticated user object or None if authentication fails.

        """
        user = self.get_user_by_username(username)

        if user and user.is_active and verify_password(password, user.password_hash):
            return user

        return None

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user.

        Args:
            user_data (UserCreate): The data for the new user.

        Returns:
            User: The created user object.

        """
        password_hash = hash_password(user_data.password)
        boinc_password_hash = hash_boinc_password(user_data.username, user_data.password)

        user = User(
            username=user_data.username,
            password_hash=password_hash,
            boinc_password_hash=boinc_password_hash,
            email=user_data.email,
            role=user_data.role,
            is_active=user_data.is_active,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def delete_user(self, user_id: UUID) -> bool:
        """Delete a user by ID.

        Args:
            user_id (UUID): The ID of the user to delete.

        Returns:
            bool: True if the user exists and was deleted, False otherwise.

        """
        user = self.get_user(user_id)

        if not user:
            return False

        self.db.delete(user)
        self.db.commit()

        return True

    def get_user(self, user_id: UUID) -> User | None:
        """Get a user by ID.

        Args:
            user_id (UUID): The ID of the user.

        Returns:
            User | None: The user object if the user exists, None otherwise.

        """
        return self.db.get(User, user_id)

    def get_user_by_username(self, username: str) -> User | None:
        """Get a user by username.

        Args:
            username (str): The username of the user.

        Returns:
            User | None: The user object if the user exists, None otherwise.

        """
        return self.db.exec(select(User).where(User.username == username)).first()

    def get_users(self, offset: int = 0, limit: int = 100) -> list[User]:
        """Get a list of users.

        Args:
            offset (int): The number of users to skip.
            limit (int): The maximum number of users to return.

        Returns:
            list[User]: A list of user objects.

        """
        return list(self.db.exec(select(User).order_by(User.username).offset(offset).limit(limit)).all())

    def update_user(self, user_id: UUID, user_data: UserUpdate) -> User | None:
        """Update a user.

        Args:
            user_id (UUID): The ID of the user to update.
            user_data (UserUpdate): The data to update the user with.

        Returns:
            User | None: The updated user object if the user exists, None otherwise.

        """
        user = self.get_user(user_id)

        if user:
            update_data = user_data.model_dump(exclude_none=True)

            if "password" in update_data:
                password = update_data.pop("password")

                update_data["password_hash"] = hash_password(password)
                update_data["boinc_password_hash"] = hash_boinc_password(user.username, password)

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
