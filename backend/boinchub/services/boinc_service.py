# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for BOINC-related operations."""

import datetime

from decimal import Decimal
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from boinchub.core.database import get_db
from boinchub.core.settings import settings
from boinchub.core.xmlrpc import AccountManagerReply, AccountManagerRequest, BoincError, GlobalPreferences, HostSpecific
from boinchub.models.preference_group import PreferenceGroup
from boinchub.services.computer_service import ComputerService
from boinchub.services.preference_group_service import PreferenceGroupService
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
        computer_service = ComputerService(self.db)
        computer = computer_service.update_or_create_from_request(user, request)

        # Ensure the computer has a preference group
        preference_group_service = PreferenceGroupService(self.db)
        if not computer.preference_group:
            default_group = preference_group_service.get_default(user.id)
            computer.preference_group = default_group
            self.db.add(computer)
            self.db.commit()
            self.db.refresh(computer)

        # Get the computer's preference group and build global preferences
        global_preferences = build_global_preferences(computer.preference_group)

        # Return successful response with placeholder data
        return AccountManagerReply(
            repeat_sec=3600,
            global_preferences=global_preferences,
            accounts=[],
            uuid=computer.id,
        )


def build_global_preferences(preference_group: PreferenceGroup) -> GlobalPreferences:
    """Build GlobalPreferences from a PreferenceGroup.

    Args:
        preference_group: The preference group to build preferences from.

    Returns:
        GlobalPreferences: The constructed global preferences.

    """
    # Create preferences with current timestamp
    now = datetime.datetime.now(datetime.UTC)
    mod_time = Decimal(now.timestamp())

    preference_group_data = preference_group.model_dump()

    preference_group_data["host_specific"] = HostSpecific()
    preference_group_data["source_project"] = settings.backend_url + "/boinc/"
    preference_group_data["mod_time"] = mod_time

    return GlobalPreferences.model_validate(preference_group_data)


def get_boinc_service(db: Annotated[Session, Depends(get_db)]) -> BoincService:
    """Get an instance of the BoincService.

    Args:
        db (Session): The database session to use.

    Returns:
        BoincService: An instance of the BoincService.

    """
    return BoincService(db)
