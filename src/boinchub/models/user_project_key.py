# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""User project key model for BoincHub."""

from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import sqlalchemy.types as sa_types

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

from boinchub.core.encryption import decrypt_account_key, encrypt_account_key
from boinchub.models.project import Project
from boinchub.models.user import User
from boinchub.models.util import Timestamps

if TYPE_CHECKING:
    from sqlalchemy.engine import Dialect


class EncryptedAccountKey(sa_types.TypeDecorator):  # type: ignore[type-arg]
    """Custom SQLAlchemy type for encrypted account keys."""

    impl = sa_types.String

    cache_ok = True

    def process_bind_param(self, value: str | None, dialect: Dialect) -> str:  # noqa: ARG002, PLR6301
        """Encrypt the account key before storing it in the database.

        Args:
            value (str | None): The account key to encrypt.
            dialect (Dialect): The SQLAlchemy dialect being used.

        Returns:
            str: The encrypted account key, or an empty string if the value is None or empty.

        """
        if not value:
            return ""
        return encrypt_account_key(value)

    def process_result_value(self, value: str | None, dialect: Dialect) -> str:  # noqa: ARG002, PLR6301
        """Decrypt the account key when retrieving it from the database.

        Args:
            value (str | None): The encrypted account key from the database.
            dialect (Dialect): The SQLAlchemy dialect being used.

        Returns:
            str: The decrypted account key, or an empty string if the value is None or empty.

        """
        if not value:
            return ""
        return decrypt_account_key(value)


class UserProjectKeyBase(SQLModel):
    """User project key base model."""

    # Foreign keys
    user_id: UUID = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    project_id: UUID = Field(foreign_key="projects.id", ondelete="CASCADE", index=True)

    # Account key
    account_key: str = Field(default="", sa_type=EncryptedAccountKey)


class UserProjectKey(UserProjectKeyBase, Timestamps, table=True):
    """User project key model."""

    # SQLAlchemy table name and constraints
    __tablename__: str = "user_project_keys"  # type: ignore[misc]
    __table_args__ = (UniqueConstraint("user_id", "project_id"),)

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    user: User = Relationship(back_populates="project_keys")
    project: Project = Relationship(back_populates="user_keys")


class UserProjectKeyPublic(UserProjectKeyBase, Timestamps):
    """Public model for user project key in API responses."""

    # Primary key
    id: UUID


class UserProjectKeyCreate(UserProjectKeyBase):
    """Model for creating a new user project key."""


class UserProjectKeyUpdate(SQLModel):
    """Model for updating a user project key."""

    # Account key
    account_key: str | None = None
