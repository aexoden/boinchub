# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""BOINC project configuration endpoint."""

from fastapi import APIRouter, Response

from boinchub.core.settings import settings

router = APIRouter(
    prefix="/boinc",
)


@router.get("/get_project_config.php", response_class=Response)
async def get_project_config() -> Response:
    """Get the BOINC project configuration.

    Returns:
        XML response with the account manager configuration.

    """
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<project_config>
    <name>{settings.account_manager_name}</name>
    <account_manager/>
    <client_account_creation_disabled/>
    <min_passwd_length>{settings.min_password_length}</min_passwd_length>
    <uses_username/>
</project_config>
"""

    return Response(content=xml_content, media_type="application/xml")
