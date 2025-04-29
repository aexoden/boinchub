# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""RPC endpoint for BOINC account manager."""

import logging

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import ValidationError

from boinchub.core.xmlrpc import AccountManagerRequest
from boinchub.services.account_service import AccountService

router = APIRouter(
    prefix="/boinc",
)


@router.post("/rpc.php", response_class=Response)
async def rpc(request: Request) -> Response:
    """RPC endpoint for the BOINC account manager.

    Args:
        request: The HTTP request containing the XML data.

    Returns:
        XML response with the account manager reply.

    Raises:
        HTTPException: If the request is invalid or if an internal error occurs.

    """
    body = await request.body()

    try:
        request_data = AccountManagerRequest.from_xml(body)

        account_service = AccountService()
        reply = await account_service.process_request(request_data)

        xml_content = reply.to_xml(encoding="utf-8", xml_declaration=True, pretty_print=True, exclude_none=True)

        return Response(content=xml_content, media_type="application/xml")
    except ValidationError as e:
        logger = logging.getLogger(__name__)
        logger.exception("Validation error")
        raise HTTPException(status_code=400, detail="Invalid request") from e
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.exception("Unexpected error")
        raise HTTPException(status_code=500, detail="Internal server error") from e
