# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for BOINC-related operations."""

import datetime
import logging

from decimal import Decimal
from typing import Annotated

from fastapi import Depends
from packaging import version
from sqlmodel import Session

from boinchub.core.database import get_db
from boinchub.core.settings import settings
from boinchub.core.xmlrpc import (
    Account,
    AccountManagerReply,
    AccountManagerRequest,
    BoincError,
    GlobalPreferences,
    HostSpecific,
)
from boinchub.core.xmlrpc import (
    Project as XmlProject,
)
from boinchub.models.computer import Computer
from boinchub.models.preference_group import PreferenceGroup
from boinchub.models.project import Project
from boinchub.models.project_attachment import ProjectAttachment
from boinchub.models.user import User
from boinchub.models.user_project_key import UserProjectKey
from boinchub.services.computer_service import ComputerService
from boinchub.services.preference_group_service import PreferenceGroupService
from boinchub.services.project_attachment_service import ProjectAttachmentService
from boinchub.services.project_service import ProjectService
from boinchub.services.user_project_key_service import UserProjectKeyService
from boinchub.services.user_service import UserService

logger = logging.getLogger(__name__)


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

        # Process project attachments
        accounts = self._process_projects(user, computer, request)

        # Get the computer's preference group and build global preferences
        global_preferences = build_global_preferences(computer.preference_group)

        # Return successful response with placeholder data
        return AccountManagerReply(
            repeat_sec=3600,
            global_preferences=global_preferences,
            accounts=accounts,
            uuid=computer.id,
        )

    def _process_projects(self, user: User, computer: Computer, request: AccountManagerRequest) -> list[Account]:  # noqa: C901, PLR0912, PLR0914, PLR0915
        """Process project attachments for the computer.

        There are probably corner cases that this doesn't handle very well, especially if very old clients are used.
        As far as I've been able to tell, the BOINC protocol is not very well documented, so until more BOINC clients
        are observed in the wild, this will have to be sufficient.

        Args:
            user (User): The user associated with the request.
            computer (Computer): The computer making the request.
            request (AccountManagerRequest): The request data from the BOINC client.)

        Returns:
            list[Account]: A list of account configurations to send to the client.

        """
        project_service = ProjectService(self.db)
        attachment_service = ProjectAttachmentService(self.db)
        key_service = UserProjectKeyService(self.db)

        # Get all enabled projects
        enabled_projects = project_service.get_enabled(offset=0, limit=1000)
        enabled_project_map = {p.id: p for p in enabled_projects}

        # Get user's project keys
        keys = key_service.get_by_user(user.id)
        key_map = {key.project_id: key for key in keys}

        # Get current attachments for this computer
        current_attachments = attachment_service.get_by_computer(computer.id)
        attachment_map = {a.project_id: a for a in current_attachments}

        # Create a map of client-reported projects
        client_projects = {p.url: p for p in request.projects}

        # Parse client version for compatibility checks
        client_version = parse_client_version(request.client_version)

        accounts = []

        # Iterate through client-reported projects and detach any that no longer have attachments.
        for xml_project in request.projects:
            if xml_project.url not in attachment_map:
                project = project_service.get_by_url(xml_project.url)

                if project:
                    account = create_detach_account(project)

        for attachment in current_attachments:
            # Check if project was disabled or deleted, and handle accordingly
            project = enabled_project_map.get(attachment.project_id)

            if not project:
                account = create_detach_account(attachment.project)

                if account:
                    accounts.append(account)
                    attachment_service.delete(attachment.id)

                continue

            # Check if the user still has a key for the project
            key = key_map.get(project.id)

            if not key:
                account = create_detach_account(project)

                if account:
                    accounts.append(account)
                    attachment_service.delete(attachment.id)

                continue

            # Check if the client has this project in its list
            client_project = client_projects.get(project.url)

            if not client_project:
                if attachment.detach_when_done:
                    attachment_service.delete(attachment.id)
                    logger.info("Deleted attachment %s for user %s (detach_when_done)", attachment.id, user.username)
                else:
                    account = create_attach_account(project, key, attachment, client_version)

                    if account:
                        accounts.append(account)
            elif attachment_settings_changed(key, attachment, client_project):
                account = create_attach_account(project, key, attachment, client_version)

                if account:
                    # The account key can be empty if no changes are required
                    if account.authenticator == client_project.account_key:
                        account.authenticator = ""

                    accounts.append(account)
            else:
                # It's possible that we can skip sending the account if nothing has changed. However, there are
                # additional cases that we don't currently handle, such as the user changing their resource settings.
                # For now, we'll just unconditionally send the accounts.
                account = create_attach_account(project, key, attachment, client_version)

                if account:
                    if account.authenticator == client_project.account_key:
                        account.authenticator = ""

                    accounts.append(account)

        return accounts


def attachment_settings_changed(key: UserProjectKey, attachment: ProjectAttachment, client_project: XmlProject) -> bool:
    """Check if attachment settings have changed.

    Args:
        attachment (ProjectAttachment): The current attachment settings.
        client_project (XmlProject): The project settings reported by the client.

    Returns:
        bool: True if settings have changed, False otherwise.

    """
    if key.account_key != client_project.account_key:
        return True

    if attachment.resource_share != client_project.resource_share:
        return True

    if attachment.suspended != client_project.suspended_via_gui:
        return True

    if attachment.dont_request_more_work != client_project.dont_request_more_work:
        return True

    return attachment.detach_when_done != client_project.detach_when_done


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


def create_attach_account(  # noqa: C901
    project: Project, user_key: UserProjectKey, attachment: ProjectAttachment, client_version: version.Version | None
) -> Account | None:
    """Create an account configuration for attaching (or remaining attached) to a project.

    Args:
        project (Project): The project to attach to.
        user_key (UserProjectKey): The user's account key for the project.
        attachment (ProjectAttachment): The project attachment details.
        client_version (version.Version | None): The version of the BOINC client.

    Returns:
        Account | None: The account configuration, or None if the client is too old for weak account keys and the user
                        has a weak account key configured.

    """
    account_key = user_key.account_key
    is_weak_account_key = "_" in account_key

    # Pre-6.13 clients do not support weak account keys
    if is_weak_account_key and (not client_version or client_version < version.parse("6.13.0")):
        logger.warning("Not sending weak account key to old client %s for project %s", client_version, project.name)
        return None

    account = Account(
        url=project.url,
        url_signature=project.signed_url,
        authenticator=account_key,
        resource_share=attachment.resource_share,
    )

    # Set resource restrictions based on client version
    if client_version and client_version >= version.parse("7.0.0"):
        restrictions = []

        if attachment.no_cpu:
            restrictions.append("CPU")
        if attachment.no_gpu_nvidia:
            restrictions.append("NVIDIA")
        if attachment.no_gpu_amd:
            restrictions.append("ATI")
        if attachment.no_gpu_intel:
            restrictions.append("intel_gpu")

        if len(restrictions) > 0:
            account.no_rsc = restrictions
    else:
        if attachment.no_cpu:
            account.no_cpu = True
        if attachment.no_gpu_nvidia:
            account.no_cuda = True
        if attachment.no_gpu_amd:
            account.no_ati = True

    # Set other flags
    account.suspend = attachment.suspended
    account.dont_request_more_work = attachment.dont_request_more_work
    account.detach_when_done = attachment.detach_when_done

    return account


def create_detach_account(project: Project) -> Account | None:
    """Create an account configuration for detaching from a project.

    Args:
        project (Project): The project to detach from

    Returns:
        Account | None: The account configuration for detaching, or None if the project is not attachable.

    """
    return Account(
        url=project.url,
        url_signature=project.signed_url,
        authenticator="",
        detach=True,
    )


def get_boinc_service(db: Annotated[Session, Depends(get_db)]) -> BoincService:
    """Get an instance of the BoincService.

    Args:
        db (Session): The database session to use.

    Returns:
        BoincService: An instance of the BoincService.

    """
    return BoincService(db)


def parse_client_version(version_str: str) -> version.Version | None:
    """Parse the client version string into a Version object.

    Args:
        version_str (str): The version string to parse.

    Returns:
        Version | None: The parsed version, or None if parsing fails.

    """
    try:
        return version.parse(version_str)
    except Exception as e:  # noqa: BLE001
        logger.warning("Failed to parse client version '%s': %s", version_str, e)
        return None
