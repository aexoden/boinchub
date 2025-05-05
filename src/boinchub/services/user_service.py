# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for user-related operations."""

import hashlib

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
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
    def authenticate_boinc_client(db: Session, username: str, boinc_password_hash: str) -> User | None:
        """Authenticate a BOINC client.

        Args:
            db (Session): The database session.
            username (str): The username of the user.
            boinc_password_hash (str): The password hash from the BOINC client.

        Returns:
            The authenticated user object or None if authentication fails.
        """
        user = db.query(User).filter(User.username == username).first()

        if user and user.boinc_password_hash == boinc_password_hash:
            return user

        return None

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> User | None:
        """Authenticate a user.

        Args:
            db (Session): The database session.
            username (str): The username of the user.
            password (str): The password to authenticate.

        Returns:
            The authenticated user object or None if authentication fails.
        """
        user = db.query(User).filter(User.username == username).first()

        if user:
            ph = PasswordHasher()

            try:
                ph.verify(user.password_hash, password)
            except VerifyMismatchError:
                return None

        return user

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user account.

        Args:
            db (Session): The database session.
            user_data (UserCreate): The data for the new user.

        Returns:
            The created user object.
        """
        boinc_password_hash = UserService.hash_boinc_password(user_data.username, user_data.password)
        password_hash = UserService.hash_password(user_data.password)

        db_user = User(
            username=user_data.username,
            password_hash=password_hash,
            boinc_password_hash=boinc_password_hash,
            email=user_data.email,
        )

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
    def hash_boinc_password(username: str, password: str) -> str:
        """Hash a password for BOINC protocol compatibility.

        Args:
            username (str): The username of the user.
            password (str): The password to hash.

        Returns:
            The MD5 hashed password required by BOINC protocol.
        """
        # The use of MD5 is mandated by the BOINC protocol.
        return hashlib.md5(f"{password}{username.lower()}".encode()).hexdigest()  # noqa: S324

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using Argon2.

        Args:
            password (str): The password to hash.

        Returns:
            The hashed password.

        """
        ph = PasswordHasher()
        return ph.hash(password)
