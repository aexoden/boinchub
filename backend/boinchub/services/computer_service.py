# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for computer-related operations."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.core.xmlrpc import AccountManagerRequest
from boinchub.models.computer import Computer, ComputerCreate
from boinchub.models.user import User


class ComputerService:
    """Service for computer-related operations."""

    def __init__(self, db: Session) -> None:
        """Initialize the ComputerService with a database session.

        Args:
            db (Session): The databases session to use for operations.

        """
        self.db = db

    def create_computer(self, computer_data: ComputerCreate) -> Computer:
        """Create a new computer.

        Args:
            computer_data (ComputerCreate): The data for the new computer.

        Returns:
            Computer: The created computer object.

        """
        computer = Computer.model_validate(computer_data)

        self.db.add(computer)
        self.db.commit()
        self.db.refresh(computer)

        return computer

    def delete_computer(self, computer_id: UUID) -> bool:
        """Delete a computer by ID.

        Args:
            computer_id (UUID): The ID of the computer to delete.

        Returns:
            bool: True if the computer exists and was deleted, False otherwise.

        """
        computer = self.get_computer(computer_id)

        if not computer:
            return False

        self.db.delete(computer)
        self.db.commit()

        return True

    def get_computer(self, computer_id: UUID) -> Computer | None:
        """Get a computer by ID.

        Args:
            id (UUID): The ID of the computer.

        Returns:
            Computer | None: The computer object if it exists, None otherwise.

        """
        return self.db.get(Computer, computer_id)

    def get_computer_by_cpid(self, cpid: str) -> Computer | None:
        """Get a computer by its BOINC CPID.

        Args:
            cpid (str): The CPID of the computer.

        Returns:
            Computer | None: The computer object if it exists, None otherwise.

        """
        return self.db.exec(select(Computer).where(Computer.cpid == cpid)).first()

    def get_computers(self, user_id: UUID | None) -> list[Computer]:
        """Get all computers, optionally for a user.

        Args:
            user_id (UUID | None): The optional ID of the user.

        Returns:
            list[Computer]: A list of computers.

        """
        if user_id is None:
            return list(self.db.exec(select(Computer)).all())

        return list(self.db.exec(select(Computer).where(Computer.user_id == user_id)).all())

    def update_or_create_computer_from_request(self, user: User, request: AccountManagerRequest) -> Computer:
        """Update or create a computer based on an account manager request.

        Args:
            user (User): The user associated with the computer.
            request (AccountManagerRequest): The BOINC account manager request.

        Returns:
            Computer: The updated or created computer object.

        """
        # Attempt to look up the target computer by UUID, if it matches the authenticated user.
        if request.uuid:
            computer = self.get_computer(request.uuid)

            if computer and computer.user_id == user.id:
                # Update metadata
                computer.cpid = request.host_cpid
                computer.hostname = request.domain_name

                self.db.add(computer)
                self.db.commit()
                self.db.refresh(computer)

                return computer

        # Attempt to look up the computer by CPID, again if it matches the authenticated user.
        computer = self.get_computer_by_cpid(request.host_cpid)

        if computer and computer.user_id == user.id:
            computer.hostname = request.domain_name

            self.db.add(computer)
            self.db.commit()
            self.db.refresh(computer)

            return computer

        # Attempt to look up by the previous CPID, if provided.
        if request.previous_host_cpid:
            computer = self.get_computer_by_cpid(request.previous_host_cpid)

            if computer and computer.user_id == user.id:
                computer.cpid = request.host_cpid
                computer.hostname = request.domain_name

                self.db.add(computer)
                self.db.commit()
                self.db.refresh(computer)

                return computer

        # Fall back to creating a new computer.
        computer_data = ComputerCreate(
            cpid=request.host_cpid,
            hostname=request.domain_name,
            user_id=user.id,
        )

        return self.create_computer(computer_data)


def get_computer_service(db: Annotated[Session, Depends(get_db)]) -> ComputerService:
    """Get an instance of the ComputerService.

    Args:
        db (Session): The database session to use.

    Returns:
        ComputerService: An instance of the ComputerService.

    """
    return ComputerService(db)
