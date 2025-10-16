# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for preference group operations."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, or_, select

from boinchub.core.database import get_db
from boinchub.models.preference_group import PreferenceGroup, PreferenceGroupCreate, PreferenceGroupUpdate
from boinchub.services.base_service import BaseService


class PreferenceGroupService(BaseService[PreferenceGroup, PreferenceGroupCreate, PreferenceGroupUpdate]):
    """Service for preference group operations."""

    model = PreferenceGroup

    def get_all(
        self,
        offset: int = 0,
        limit: int = 100,
        order_by: str | None = None,
        **filters: Any,  # noqa: ANN401
    ) -> list[PreferenceGroup]:
        """Get a list of preference groups.

        Args:
            offset (int): The number of preference groups to skip.
            limit (int): The maximum number of preference groups to return.
            order_by (str | None): The field to order by.
            **filters (Any): Additional filters to apply.

        Returns:
            list[PreferenceGroup]: A list of preference groups.

        """
        return super().get_all(offset=offset, limit=limit, order_by=order_by or "name", **filters)

    def get_available_for_user(self, user_id: UUID | None, offset: int = 0, limit: int = 100) -> list[PreferenceGroup]:
        """Get preference groups available for a user.

        Args:
            user_id (UUID | None): The ID of the user to filter preference groups for.
            offset (int): The number of preference groups to skip.
            limit (int): The maximum number of preference groups to return.

        Returns:
            list[PreferenceGroup]: A list of preference groups available for the user.

        """
        query = select(PreferenceGroup).where(or_(PreferenceGroup.user_id == user_id, PreferenceGroup.user_id == None))  # noqa: E711

        return list(self.db.exec(query.order_by(PreferenceGroup.name).offset(offset).limit(limit)).all())

    def get_by_name(self, name: str, user_id: UUID | None) -> PreferenceGroup | None:
        """Get a preference group by name.

        Args:
            name (str): The name of the preference group.
            user_id (UUID | None): The ID of the owning user, if applicable. Defaults to None (global preference group).

        Returns:
            PreferenceGroup | None: The preference group if found, None otherwise.

        """
        return self.db.exec(
            select(PreferenceGroup).where(PreferenceGroup.name == name, PreferenceGroup.user_id == user_id)
        ).first()

    def get_default(self, user_id: UUID | None) -> PreferenceGroup:
        """Get the default preference group, creating one if none exists.

        Args:
            user_id (UUID | None): The ID of the owning user, if applicable. Defaults to None (global preference group).

        Returns:
            PreferenceGroup: The default preference group for the user if it exists, the global default otherwise.

        """
        # First, check if a default group exists for the user, if specified
        if user_id:
            default_group = self.db.exec(
                select(PreferenceGroup).where(PreferenceGroup.is_default == True, PreferenceGroup.user_id == user_id)  # noqa: E712
            ).first()

            if default_group:
                return default_group

        # If no user default or no user specified, check for global default
        default_group = self.db.exec(
            select(PreferenceGroup).where(
                PreferenceGroup.is_default == True,  # noqa: E712
                PreferenceGroup.user_id == None,  # noqa: E711
            )
        ).first()

        if default_group:
            return default_group

        # If no default group exists, create a new one
        default_data = PreferenceGroupCreate(
            name="Default",
            description="Default preference group with default BOINC settings",
            is_default=True,
        )

        return self.create(default_data)

    def create(self, object_data: PreferenceGroupCreate) -> PreferenceGroup:
        """Create a new preference group.

        Args:
            object_data (PreferenceGroupCreate): The data for the new preference group.

        Returns:
            PreferenceGroup: The created preference group.

        Raises:
            HTTPException: If a preference group with the same name already exists.

        """
        existing_group = self.get_by_name(object_data.name, object_data.user_id)
        if existing_group:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="A preference group with this name already exists"
            )

        if object_data.is_default:
            self._unset_existing_default(object_data.user_id)

        return super().create(object_data)

    def update(self, object_id: UUID, object_data: PreferenceGroupUpdate) -> PreferenceGroup | None:
        """Update a preference group.

        Args:
            object_id (UUID): The ID of the preference group to update.
            object_data (PreferenceGroupUpdate): The data to update the preference group with.

        Returns:
            PreferenceGroup | None: The updated preference group, or None if not found.

        Raises:
            HTTPException: If a preference group with the same name already exists

        """
        preference_group = self.get(object_id)
        if not preference_group:
            return None

        if object_data.name and object_data.name != preference_group.name:
            existing_group = self.get_by_name(object_data.name, preference_group.user_id)
            if existing_group:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, detail="A preference group with this name arleady exists"
                )

        if object_data.is_default:
            self._unset_existing_default(preference_group.user_id)

        return super().update(object_id, object_data)

    def delete(self, object_id: UUID) -> bool:
        """Delete a preference group.

        Args:
            object_id (UUID): The ID of the preference group to delete.

        Returns:
            bool: True if the preference group was deleted, False if it didn't exist.

        Raises:
            HTTPException: If trying to delete a preference group that has computers assigned to it.

        """
        preference_group = self.get(object_id)
        if not preference_group:
            return False

        if preference_group.computers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete preference group that has computers assigned to it. "
                "Please reassign the computers to another preference group first.",
            )

        return super().delete(object_id)

    def _unset_existing_default(self, user_id: UUID | None) -> None:
        """Unset any existing default preference group."""
        existing_default = self.db.exec(
            select(PreferenceGroup).where(PreferenceGroup.is_default == True, PreferenceGroup.user_id == user_id)  # noqa: E712
        ).first()

        if existing_default:
            existing_default.is_default = False
            self.db.add(existing_default)
            self.db.commit()
            self.db.refresh(existing_default)


def get_preference_group_service(db: Annotated[Session, Depends(get_db)]) -> PreferenceGroupService:
    """Get an instance of the PreferenceGroupService.

    Args:
        db (Session): The database session to use.

    Returns:
        PreferenceGroupService: An instance of the PreferenceGroupService.

    """
    return PreferenceGroupService(db)
