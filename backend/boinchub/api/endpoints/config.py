# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Frontend configuration endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from boinchub.core.settings import settings

router = APIRouter(prefix="/api/v1/config", tags=["configuration"])


class AppConfig(BaseModel):
    """Application configuration for frontend."""

    account_manager_name: str
    boinc_url: str
    min_password_length: int
    require_invite_code: bool


@router.get("")
async def get_config() -> AppConfig:
    """Get application configuration for frontend.

    Returns:
        AppConfig: Configuration data needed by the frontend.

    """
    boinc_url = settings.backend_url.rstrip("/") + "/boinc/"

    return AppConfig(
        account_manager_name=settings.account_manager_name,
        boinc_url=boinc_url,
        min_password_length=settings.min_password_length,
        require_invite_code=settings.require_invite_code,
    )
