# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for user-related operations."""

import hashlib

from pydantic import BaseModel
from sqlalchemy.orm import Session

from boinchub.models.user import User


class UserCreate(BaseModel):
    """Model for creating a new user."""

    username: str
    password: str
    email: str


class UserService:
    """Service for user-related operations."""

    @staticmethod
    def authenticate_user(db: Session, username: str, password_hash: str) -> User | None:
        """Authenticate a user.

        Args:
            db (Session): The database session.
            username (str): The username of the user.
            password (str): The password of the user.

        Returns:
            The authenticated user object or None if authentication fails.
        """
        user = db.query(User).filter(User.username == username).first()

        if user and user.password_hash == password_hash:
            return user

        return None

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user account.

        Args:
            db (Session): The database session.
            user_data (UserCreate): The data for the new user.

        Returns:
            The created user object.
        """
        password_hash = UserService.hash_password(user_data.username, user_data.password)

        db_user = User(username=user_data.username, password_hash=password_hash, email=user_data.email)

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User | None:
        """Get a user by username.

        Args:
            db (Session): The database session.
            username (str): The username of the user.

        Returns:
            The user object or None if not found.
        """
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def hash_password(username: str, password: str) -> str:
        """Hash the password for a user.

        Args:
            username (str): The username of the user.
            password (str): The password to hash.

        Returns:
            The hashed password.
        """
        # The use of MD5 is mandated by the BOINC protocol.
        return hashlib.md5(f"{password}_{username.lower()}".encode()).hexdigest()  # noqa: S324
