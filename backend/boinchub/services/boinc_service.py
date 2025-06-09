# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for BOINC-related operations."""

from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from boinchub.core.database import get_db
from boinchub.core.xmlrpc import AccountManagerReply, AccountManagerRequest, BoincError, GlobalPreferences
from boinchub.services.computer_service import ComputerService
from boinchub.services.user_service import UserService


class BoincService:
    """Service for BOINC-related operations."""

    def __init__(self, db: Session) -> None:
        """Initialize the BoincService with a database session.

        Args:
            db (Session): The database session to use.

        """
        self.db = db

    async def process_request(self, request: AccountManagerRequest) -> AccountManagerReply:
        """Process the account manager request.

        Args:
            request (AccountManagerRequest): The request data from the BOINC client.

        Returns:
            AccountManagerReply: The reply to the account manager request.

        """
        user_service = UserService(self.db)

        # Check if the user exists
        if user_service.get_by_username(request.name) is None:
            return AccountManagerReply(
                error_num=BoincError.ERR_BAD_USER_NAME,
                error_msg="Invalid username",
            )

        # Attempt to authenticate the user
        user = user_service.authenticate_boinc_client(request.name, request.password_hash)

        if not user:
            return AccountManagerReply(
                error_num=BoincError.ERR_BAD_PASSWD,
                error_msg="Invalid password",
            )

        # Create or update the computer record
        computer = ComputerService(self.db).update_or_create_from_request(user, request)

        # Return successful response with placeholder data
        return AccountManagerReply(
            repeat_sec=3600,
            global_preferences=GlobalPreferences(),
            accounts=[],
            uuid=computer.id,
        )


def get_boinc_service(db: Annotated[Session, Depends(get_db)]) -> BoincService:
    """Get an instance of the BoincService.

    Args:
        db (Session): The database session to use.

    Returns:
        BoincService: An instance of the BoincService.

    """
    return BoincService(db)
