# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Package for handling account-related operations."""

from sqlalchemy.orm import Session

from boinchub.core.xmlrpc import AccountManagerReply, AccountManagerRequest, BoincError, GlobalPreferences
from boinchub.services.computer_service import ComputerService
from boinchub.services.user_service import UserService


class AccountService:
    """Service for handling account-related operations."""

    def __init__(self, db: Session) -> None:
        """Initialize an AccountService instance.

        Args:
            db (Session): The database session to use for operations.

        """
        self.db = db

    async def process_request(self, request: AccountManagerRequest) -> AccountManagerReply:
        """Process the account manager request.

        Args:
            request: The AccountManagerRequest object containing the request data.

        Returns:
            The reply to the account manager request.

        """
        # Check if the user exists
        user = UserService.get_user_by_username(self.db, request.name)

        if not user:
            return AccountManagerReply(
                error_num=BoincError.ERR_BAD_USER_NAME,
                error_msg="Invalid username",
            )

        # Authenticate the user with BOINC-specific method
        authenticated_user = UserService.authenticate_boinc_client(self.db, request.name, request.password_hash)

        if not authenticated_user:
            return AccountManagerReply(
                error_num=BoincError.ERR_BAD_PASSWD,
                error_msg="Invalid password",
            )

        # Create or update computer record.
        computer = ComputerService.update_or_create_computer(
            self.db,
            authenticated_user,
            request,
        )

        # Return successful response with placeholder data
        return AccountManagerReply(
            repeat_sec=3600,
            global_preferences=GlobalPreferences(),
            accounts=[],
            uuid=computer.uuid,
        )
