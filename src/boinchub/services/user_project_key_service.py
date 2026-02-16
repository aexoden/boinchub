# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for user project key-related operations."""

from typing import TYPE_CHECKING, Annotated

from fastapi import Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.models.user_project_key import UserProjectKey, UserProjectKeyCreate, UserProjectKeyUpdate
from boinchub.services.base_service import BaseService

if TYPE_CHECKING:
    from uuid import UUID


class UserProjectKeyService(BaseService[UserProjectKey, UserProjectKeyCreate, UserProjectKeyUpdate]):
    """Service for user project key-related operations."""

    model = UserProjectKey

    def get_by_user(self, user_id: UUID) -> list[UserProjectKey]:
        """Get all project keys for a user.

        Args:
            user_id (UUID): The ID of the user.

        Returns:
            list[UserProjectKey]: A list of user project key objects for the specific user.

        """
        return list(self.db.exec(select(UserProjectKey).where(UserProjectKey.user_id == user_id)).all())

    def get_by_project(self, project_id: UUID) -> list[UserProjectKey]:
        """Get all user keys for a project.

        Args:
            project_id (UUID): The ID of the project.

        Returns:
            list[UserProjectKey]: A list of user project key objects for the specific project.

        """
        return list(self.db.exec(select(UserProjectKey).where(UserProjectKey.project_id == project_id)).all())

    def get_by_user_project(self, user_id: UUID, project_id: UUID) -> UserProjectKey | None:
        """Get a specific user project key.

        Args:
            user_id (UUID): The ID of the user.
            project_id (UUID): The ID of the project.

        Returns:
            UserProjectKey | None: The user project key if found, otherwise None.

        """
        return self.db.exec(
            select(UserProjectKey).where(UserProjectKey.user_id == user_id, UserProjectKey.project_id == project_id)
        ).first()

    def create_or_update_by_user_project(self, user_id: UUID, project_id: UUID, account_key: str) -> UserProjectKey:
        """Create or update a user project key.

        Args:
            user_id (UUID): The ID of the user.
            project_id (UUID): The ID of the project.
            account_key (str): The account key for the project.

        Returns:
            UserProjectKey: The created or updated user project key.

        """
        existing_key = self.get_by_user_project(user_id, project_id)

        if existing_key:
            existing_key.account_key = account_key
            self.db.add(existing_key)
            self.db.commit()
            return existing_key

        key_data = UserProjectKeyCreate(user_id=user_id, project_id=project_id, account_key=account_key)
        return self.create(key_data)

    def delete_by_user_project(self, user_id: UUID, project_id: UUID) -> bool:
        """Delete a user project key.

        Args:
            user_id (UUID): The ID of the user.
            project_id (UUID): The ID of the project.

        Returns:
            bool: True if the key was deleted, False if it did not exist.

        """
        existing_key = self.get_by_user_project(user_id, project_id)

        if existing_key:
            self.db.delete(existing_key)
            self.db.commit()
            return True

        return False


def get_user_project_key_service(db: Annotated[Session, Depends(get_db)]) -> UserProjectKeyService:
    """Get the user project key service.

    Args:
        db (Session): The database session.

    Returns:
        UserProjectKeyService: An instance of the user project key service.

    """
    return UserProjectKeyService(db=db)
