# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""RPC endpoint for BOINC account manager."""

import logging

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from boinchub.core.database import get_db
from boinchub.core.xmlrpc import AccountManagerReply, AccountManagerRequest, BoincError
from boinchub.services.account_service import AccountService

router = APIRouter(
    prefix="/boinc",
)


@router.post("/rpc.php")
async def rpc(request: Request, db: Annotated[Session, Depends(get_db)]) -> Response:
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
        account_service = AccountService(db)
        reply = await account_service.process_request(request_data)
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
