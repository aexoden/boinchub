# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for invite code-related operations."""

import datetime

from typing import Annotated, Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.models.invite_code import InviteCode, InviteCodeCreate, InviteCodeUpdate, generate_invite_code
from boinchub.models.user import User
from boinchub.services.base_service import BaseService


class InviteCodeService(BaseService[InviteCode, InviteCodeCreate, InviteCodeUpdate]):
    """Service for invite code-related operations."""

    model = InviteCode

    def get_all(
        self,
        offset: int = 0,
        limit: int = 100,
        order_by: str | None = None,
        **filters: Any,  # noqa: ANN401
    ) -> list[InviteCode]:
        """Get a list of invite codes.

        Args:
            offset (int): The number of records to skip.
            limit (int): The maximum number of records to return.
            order_by (str | None): The field to order by.
            **filters: Additional filters to apply.

        Returns:
            list[InviteCode]: A list of invite codes.

        """
        return super().get_all(offset=offset, limit=limit, order_by=order_by or "created_at", **filters)

    def get_by_code(self, code: str) -> InviteCode | None:
        """Get an invite code by its code.

        Args:
            code (str): The invite code string.

        Returns:
            InviteCode | None: The invite code if found, otherwise None.

        """
        return self.db.exec(select(InviteCode).where(InviteCode.code == code)).first()

    def use(self, code: str, used_by: User) -> InviteCode | None:
        """Mark an invite code as used by a user.

        Args:
            code (str): The invite code to use.
            used_by (User): The user who is using the invite code.

        Returns:
            InviteCode | None: The updated invite code if successful, otherwise None.

        Raises:
            HTTPException: If the invite code is invalid or already used.

        """
        invite_code = self.get_by_code(code)

        if not invite_code or not invite_code.is_active or invite_code.is_used:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already used invite code")

        invite_code.used_by = used_by
        invite_code.used_at = datetime.datetime.now(datetime.UTC)

        self.db.add(invite_code)
        self.db.commit()
        self.db.refresh(invite_code)

        return invite_code

    def validate(self, code: str) -> bool:
        """Validate an invite code.

        Args:
            code (str): The invite code to validate.

        Returns:
            bool: True if the code is valid, False otherwise.

        """
        invite_code = self.get_by_code(code)

        return invite_code is not None and invite_code.is_active and not invite_code.is_used

    def create_with_user(self, object_data: InviteCodeCreate, created_by: User) -> InviteCode:
        """Create a new invite code.

        Args:
            object_data (InviteCodeCreate): The data for the new invite code.

        Returns:
            InviteCode: The created invite code object.

        Raises:
            HTTPException: If the invite code already exists or if the user does not have permission to create it.

        """
        invite_code = InviteCode(created_by_user_id=created_by.id)

        if object_data.code:
            invite_code.code = object_data.code

        existing_code = self.get_by_code(invite_code.code)

        # If a code was provided, generate an error if it already exists. If the code was auto-generated, just keep
        # generating a new one until we find a free one. This is unlikely to ever happen in practice.
        if existing_code:
            if object_data.code is not None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite code already exists")

            while True:
                new_code = generate_invite_code()
                existing_code = self.get_by_code(new_code)
                if not existing_code:
                    break

            invite_code.code = new_code

        self.db.add(invite_code)
        self.db.commit()
        self.db.refresh(invite_code)

        return invite_code

    def deactivate(self, object_id: UUID) -> InviteCode | None:
        """Deactivate an invite code.

        Args:
            object_id (UUID): The ID of the invite code to deactivate.

        Returns:
            InviteCode | None: The deactivated invite code if found, otherwise None.

        """
        invite_code = self.get(object_id)

        if not invite_code:
            return None

        invite_code.is_active = False
        self.db.add(invite_code)
        self.db.commit()
        self.db.refresh(invite_code)

        return invite_code


def get_invite_code_service(db: Annotated[Session, Depends(get_db)]) -> InviteCodeService:
    """Get an instance of the InviteCodeService.

    Args:
        db (Session): The database session.

    Returns:
        InviteCodeService: An instance of the invite code service.

    """
    return InviteCodeService(db)
