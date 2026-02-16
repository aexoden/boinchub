# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Utility classes and functions for models."""

import datetime

from sqlmodel import DateTime, Field, func


class Timestamps:
    """Mixin for timestamp fields."""

    created_at: datetime.datetime = Field(
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        sa_column_kwargs={"server_default": func.now()},
        default_factory=lambda: datetime.datetime.now(tz=datetime.UTC),
    )

    updated_at: datetime.datetime = Field(
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
        default_factory=lambda: datetime.datetime.now(tz=datetime.UTC),
    )
