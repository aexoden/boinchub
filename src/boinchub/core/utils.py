# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Utility functions for BoincHub."""

import ipaddress

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import Request


def get_client_ip(request: Request) -> str:
    """Extract the real client IP address from the request.

    When behind a proxy, the applicaiton needs to check special headers that
    proxies set to preserve the original client IP address.

    Args:
        request (Request): The FastAPI request object.

    Returns:
        str: The real client IP address, or "unknown" if it cannot be determined.

    """
    proxy_headers = [
        "X-Forwarded-For",
        "X-Real-IP",
        "X-Client-IP",
        "CF-Connecting-IP",
        "True-Client-IP",
    ]

    # Check each proxy header
    for header in proxy_headers:
        header_value = request.headers.get(header)

        if header_value:
            if header == "X-Forwarded-For":
                ips = [ip.strip() for ip in header_value.split(",")]

                if ips and ips[0]:
                    client_ip = ips[0]

                    if _is_valid_ip(client_ip):
                        return client_ip
            elif _is_valid_ip(header_value.strip()):
                return header_value.strip()

    # Fallback to direct client IP if no proxy headers found
    if request.client and request.client.host:
        return request.client.host

    return "Unknown"


def _is_valid_ip(ip: str) -> bool:
    """Check if a string is a valid IP address.

    Args:
        ip (str): The IP address string to validate.

    Returns:
        bool: True if the string is a valid IPv4 or IPv6 address, False otherwise.

    """
    try:
        ipaddress.ip_address(ip)
    except ValueError:
        return False
    else:
        return True
