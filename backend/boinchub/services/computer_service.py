# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for computer-related operations."""

import datetime

from typing import Annotated, Any

from fastapi import Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.core.xmlrpc import AccountManagerRequest
from boinchub.models.computer import Computer, ComputerCreate, ComputerUpdate
from boinchub.models.user import User
from boinchub.services.base_service import BaseService


class ComputerService(BaseService[Computer, ComputerCreate, ComputerUpdate]):
    """Service for computer-related operations."""

    model = Computer

    def get_all(self, offset: int = 0, limit: int = 100, order_by: str | None = None, **filters: Any) -> list[Computer]:  # noqa: ANN401
        """Get a list of computers.

        Args:
            offset (int): The number of computers to skip.
            limit (int): The maximum number of computers to return.
            order_by (str | None): The field to order the computers by. Defaults to "hostname".
            **filters: Additional filters to apply to the query.

        Returns:
            list[Computer]: A list of computer objects.

        """
        return super().get_all(offset=offset, limit=limit, order_by=order_by or "hostname", **filters)

    def get_by_cpid(self, cpid: str) -> Computer | None:
        """Get a computer by its BOINC CPID.

        Args:
            cpid (str): The CPID of the computer.

        Returns:
            Computer | None: The computer object if it exists, None otherwise.

        """
        return self.db.exec(select(Computer).where(Computer.cpid == cpid)).first()

    def update_or_create_from_request(self, user: User, request: AccountManagerRequest) -> Computer:
        """Update or create a computer based on an account manager request.

        Args:
            user (User): The user associated with the computer.
            request (AccountManagerRequest): The BOINC account manager request.

        Returns:
            Computer: The updated or created computer object.

        """
        connection_time = datetime.datetime.now(datetime.UTC)

        # Attempt to look up the target computer by UUID, if it matches the authenticated user.
        if request.uuid:
            computer = self.get(request.uuid)

            if computer and computer.user_id == user.id:
                # Update metadata
                computer.cpid = request.host_cpid
                computer.hostname = request.domain_name
                computer.last_connected_at = connection_time

                self.db.add(computer)
                self.db.commit()
                self.db.refresh(computer)

                return computer

        # Attempt to look up the computer by CPID, again if it matches the authenticated user.
        computer = self.get_by_cpid(request.host_cpid)

        if computer and computer.user_id == user.id:
            computer.hostname = request.domain_name
            computer.last_connected_at = connection_time

            self.db.add(computer)
            self.db.commit()
            self.db.refresh(computer)

            return computer

        # Attempt to look up by the previous CPID, if provided.
        if request.previous_host_cpid:
            computer = self.get_by_cpid(request.previous_host_cpid)

            if computer and computer.user_id == user.id:
                computer.cpid = request.host_cpid
                computer.hostname = request.domain_name
                computer.last_connected_at = connection_time

                self.db.add(computer)
                self.db.commit()
                self.db.refresh(computer)

                return computer

        # Fall back to creating a new computer.
        computer_data = ComputerCreate(
            cpid=request.host_cpid,
            hostname=request.domain_name,
            user_id=user.id,
            last_connected_at=connection_time,
        )

        return self.create(computer_data)


def get_computer_service(db: Annotated[Session, Depends(get_db)]) -> ComputerService:
    """Get an instance of the ComputerService.

    Args:
        db (Session): The database session to use.

    Returns:
        ComputerService: An instance of the ComputerService.

    """
    return ComputerService(db)
