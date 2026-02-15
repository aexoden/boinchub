# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""User model for BoincHub."""

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from pydantic import field_validator
from sqlmodel import Field, Relationship, SQLModel

from boinchub.core.settings import settings
from boinchub.models import Timestamps

if TYPE_CHECKING:
    from boinchub.models.computer import Computer
    from boinchub.models.preference_group import PreferenceGroup
    from boinchub.models.user_project_key import UserProjectKey
    from boinchub.models.user_session import UserSession


def validate_role(value: str) -> str:
    """Validate that the role is valid.

    Args:
        value (str): The role to validate.

    Returns:
        str: The validated role.

    Raises:
        ValueError: If the role is not one of the allowed values.

    """
    valid_roles = ["user", "admin", "super_admin"]

    if value not in valid_roles:
        msg = f"Role must be one of: {', '.join(valid_roles)}"
        raise ValueError(msg)

    return value


def validate_username(value: str) -> str:
    """Validate that the username is valid.

    Args:
        value (str): The username to validate.

    Returns:
        str: The validated username.

    Raises:
        ValueError: If the username is invalid.

    """
    value = value.strip()

    if not value:
        msg = "Username cannot be empty"
        raise ValueError(msg)

    if len(value) < settings.min_username_length:
        msg = "Username must be at least 3 characters long"
        raise ValueError(msg)

    if len(value) > settings.max_username_length:
        msg = "Username cannot be longer than 50 characters"
        raise ValueError(msg)

    return value


class UserBase(SQLModel):
    """User base model."""

    # User properties
    username: str = Field(unique=True)
    email: str = Field(index=True)
    role: str = Field(default="user")
    is_active: bool = Field(default=True)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        """Validate that the username is valid.

        Args:
            value (str): The username to validate.

        Returns:
            str: The validated username.

        """
        return validate_username(value)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        """Validate that the role is valid.

        Args:
            value (str): The role to validate.

        Returns:
            str: The validated role.

        """
        return validate_role(value)


class User(UserBase, Timestamps, table=True):
    """User model."""

    # SQLAlchemy table name
    __tablename__: str = "users"  # type: ignore[misc]

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    computers: list["Computer"] = Relationship(back_populates="user", cascade_delete=True)
    preference_groups: list["PreferenceGroup"] = Relationship(back_populates="user", cascade_delete=True)
    project_keys: list["UserProjectKey"] = Relationship(back_populates="user", cascade_delete=True)
    sessions: list["UserSession"] = Relationship(back_populates="user", cascade_delete=True)

    # User properties
    password_hash: str
    boinc_password_hash: str

    def can_modify_user(self, target_user: "User") -> bool:
        """Check if this user can modify another user.

        Args:
            target_user (User): The user to check.

        Returns:
            bool: True if this user can modify the target user, False otherwise.

        """
        # Super admins can modify anyone except other super admins
        if self.role == "super_admin":
            return target_user.role != "super_admin" or self.id == target_user.id

        # Regular admins can modify regular users
        if self.role == "admin":
            return target_user.role == "user"

        # Regular users can only modify themselves
        return self.id == target_user.id

    def can_change_role(self, target_user: "User") -> bool:
        """Check if this user can change another user's role.

        Args:
            target_user (User): The user whose role is being changed.

        Returns:
            bool: True if this user can change the target user's role, False otherwise.

        """
        # Only super admins can change roles
        if self.role != "super_admin":
            return False

        # Super admins can't change other super admins' roles
        return target_user.role != "super_admin"


class UserPublic(UserBase, Timestamps):
    """Public user model for API responses."""

    # Primary key
    id: UUID


class UserCreate(UserBase):
    """Model for creating a new user."""

    # User properties
    password: str
    invite_code: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str) -> str:
        """Validate that the password meets the minimum length requirement.

        Args:
            value (str): The password to validate.

        Returns:
            str: The validated password.

        Raises:
            ValueError: If the password is shorter than the minimum length.

        """
        if len(value) < settings.min_password_length:
            msg = f"Password must be at least {settings.min_password_length} characters long"
            raise ValueError(msg)

        return value


class UserUpdate(SQLModel):
    """Model for updating an existing user."""

    # User properties
    username: str | None = None
    password: str | None = None
    boinc_password: str | None = None
    email: str | None = None
    role: str | None = None
    is_active: bool | None = None

    # Current password (for verification)
    current_password: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str | None) -> str | None:
        """Validate that the password meets the minimum length requirement.

        Args:
            value (str | None): The password to validate.

        Returns:
            str | None: The validated password.

        Raises:
            ValueError: If the password is shorter than the minimum length.

        """
        if value is not None and len(value) < settings.min_password_length:
            msg = f"Password must be at least {settings.min_password_length} characters long"
            raise ValueError(msg)

        return value

    @field_validator("boinc_password")
    @classmethod
    def validate_boinc_password_length(cls, value: str | None) -> str | None:
        """Validate that the BOINC password meets the minimum length requirement.

        Empty strings are allowed to indicate a reset.

        Args:
            value (str | None): The BOINC password to validate.

        Returns:
            str | None: The validated BOINC password.

        Raises:
            ValueError: If the BOINC password is shorter than the minimum length.

        """
        if value and len(value) < settings.min_password_length:
            msg = f"BOINC password must be at least {settings.min_password_length} characters long"
            raise ValueError(msg)

        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str | None) -> str | None:
        """Validate that the role is valid.

        Args:
            value (str | None): The role to validate.

        Returns:
            str | None: The validated role.

        """
        if value is not None:
            return validate_role(value)

        return None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None) -> str | None:
        """Validate that the username is valid.

        Args:
            value (str | None): The username to validate.

        Returns:
            str | None: The validated username.

        """
        if value is not None:
            return validate_username(value)

        return None
