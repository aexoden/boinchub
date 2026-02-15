# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""BOINC API endpoints."""

import logging

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import ValidationError

from boinchub.core.settings import settings
from boinchub.core.xmlrpc import AccountManagerReply, AccountManagerRequest, BoincError
from boinchub.services.boinc_service import BoincService, get_boinc_service

router = APIRouter(prefix="/boinc", tags=["boinc"])


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


@router.post("/rpc.php")
async def rpc(request: Request, boinc_service: Annotated[BoincService, Depends(get_boinc_service)]) -> Response:
    """RPC endpoint for the BOINC account manager.

    Args:
        request: The HTTP request containing the XML data.

    Returns:
        XML response with the account manager reply.
    """
    status_code = status.HTTP_200_OK
    body = await request.body()
    logger = logging.getLogger(__name__)

    try:
        request_data = AccountManagerRequest.from_xml(body)
        reply = await boinc_service.process_request(request_data)
    except ValidationError as _e:
        logger.exception("XML parsing/validation error")
        status_code = status.HTTP_400_BAD_REQUEST
        reply = AccountManagerReply(
            error_num=BoincError.ERR_XML_PARSE,
            error_msg="Invalid request format",
        )
    except Exception as _e:
        logger.exception("Unexpected error")
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        reply = AccountManagerReply(
            error_num=-1,
            error_msg="Internal server error",
        )

    xml_content = reply.to_xml(encoding="utf-8", xml_declaration=True, pretty_print=True, exclude_none=True)
    return Response(status_code=status_code, content=xml_content, media_type="application/xml")
