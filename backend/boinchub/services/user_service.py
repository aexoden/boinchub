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
    role: str = "user"
    is_active: bool = True


class UserUpdate(BaseModel):
    """Model for updating a user."""

    email: str | None = None
    password: str | None = None
    role: str | None = None
    is_active: bool | None = None


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

        if user and user.boinc_password_hash == boinc_password_hash and user.is_active:
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

        if user and user.is_active:
            ph = PasswordHasher()

            try:
                ph.verify(user.password_hash, password)
            except VerifyMismatchError:
                return None
            else:
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
        boinc_password_hash = UserService.hash_boinc_password(user_data.username, user_data.password)
        password_hash = UserService.hash_password(user_data.password)

        db_user = User(
            username=user_data.username,
            password_hash=password_hash,
            boinc_password_hash=boinc_password_hash,
            email=user_data.email,
            role=user_data.role,
            is_active=user_data.is_active,
        )

        db.add(db_user)
        db.commit()

        return db_user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User | None:
        """Get a user by ID.

        Args:
            db (Session): The database session.
            user_id (int): The ID of the user.

        Returns:
            The user object or None if not found.
        """
        return db.query(User).filter(User.id == user_id).first()

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
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
        """Get a list of users.

        Args:
            db (Session): The database session.
            skip (int): The number of users to skip.
            limit (int): The maximum number of users to return.

        Returns:
            A list of user objects.
        """
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User | None:
        """Update a user.

        Args:
            db (Session): The database session.
            user_id (int): The ID of the user to update.
            user_data (UserUpdate): The data to update.

        Returns:
            The updated user object or None if not found.
        """
        user = UserService.get_user_by_id(db, user_id)

        if not user:
            return None

        update_data = user_data.model_dump(exclude_unset=True)

        if update_data.get("password"):
            update_data["boinc_password_hash"] = UserService.hash_boinc_password(user.username, update_data["password"])
            update_data["password_hash"] = UserService.hash_password(update_data.pop("password"))

        for key, value in update_data.items():
            if value is not None:
                setattr(user, key, value)

        db.commit()

        return user

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Delete a user.

        Args:
            db (Session): The database session.
            user_id (int): The ID of the user to delete.

        Returns:
            bool: True if the user was deleted, False if not found.
        """
        user = UserService.get_user_by_id(db, user_id)

        if not user:
            return False

        db.delete(user)
        db.commit()

        return True

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
