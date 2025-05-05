# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for  computer-related operations."""

from uuid import UUID

from sqlalchemy.orm import Session

from boinchub.core.xmlrpc import AccountManagerRequest
from boinchub.models.computer import Computer
from boinchub.models.user import User


class ComputerService:
    """Service for computer-related operations."""

    @staticmethod
    def get_computer_by_cpid(db: Session, cpid: str) -> Computer | None:
        """Get a computer by its CPID.

        Args:
            db (Session): The database session.
            cpid (str): The CPID of the computer.

        Returns:
            The computer object or None if not found.

        """
        return db.query(Computer).filter(Computer.cpid == cpid).first()

    @staticmethod
    def get_computer_by_uuid(db: Session, uuid: UUID) -> Computer | None:
        """Get a computer by its UUID.

        Args:
            db (Session): The database session.
            uuid (str): The UUID of the computer.

        Returns:
            The computer object or None if not found.

        """
        return db.query(Computer).filter(Computer.uuid == uuid).first()

    @staticmethod
    def create_computer(db: Session, user: User, cpid: str, domain_name: str) -> Computer:
        """Create a new computer.

        Args:
            db (Session): The database session.
            user (User): The user associated with the computer.
            cpid (str): The CPID of the computer.
            domain_name (str): The domain name of the computer.

        Returns:
            The created computer object.

        """
        computer = Computer(
            cpid=cpid,
            domain_name=domain_name,
            user_id=user.id,
            user=user,
        )

        db.add(computer)
        db.commit()

        return computer

    @staticmethod
    def update_or_create_computer(
        db: Session,
        user: User,
        request: AccountManagerRequest,
    ) -> Computer:
        """Update or create a computer.

        Args:
            db (Session): The database session.
            user (User): The user associated with the computer.
            uuid (str): The UUID of the computer.
            cpid (str): The CPID of the computer.
            domain_name (str): The domain name of the computer.

        Returns:
            The updated or created computer object.

        """
        # Check if we have a UUID and if it belongs to the authenticated user. If it doesn't, we will simply ignore it.
        if request.uuid:
            computer = ComputerService.get_computer_by_uuid(db, request.uuid)

            if computer and computer.user_id == user.id:
                # Update metadata
                computer.cpid = request.host_cpid
                computer.domain_name = request.domain_name

                db.commit()

                return computer

        # If there was no UUID or the UUID didn't belong to the authenticated user, we will try the CPID.
        computer = db.query(Computer).filter(Computer.cpid == request.host_cpid, Computer.user_id == user.id).first()

        if computer:
            computer.domain_name = request.domain_name
            db.commit()
            return computer

        # Check if there's a previous CPID and to find by that value
        if request.previous_host_cpid:
            computer = (
                db.query(Computer)
                .filter(Computer.cpid == request.previous_host_cpid, Computer.user_id == user.id)
                .first()
            )

            if computer:
                computer.cpid = request.host_cpid
                computer.domain_name = request.domain_name
                db.commit()
                return computer

        # Create a new computer
        return ComputerService.create_computer(db, user, request.host_cpid, request.domain_name)
