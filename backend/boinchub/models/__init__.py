# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Model package."""

import datetime

from sqlalchemy import func
from sqlmodel import Field


class Timestamps:
    """Mixin for timestamp fields."""

    created_at: datetime.datetime = Field(
        sa_column_kwargs={"server_default": func.now()}, default_factory=lambda: datetime.datetime.now(tz=datetime.UTC)
    )

    updated_at: datetime.datetime = Field(
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
        default_factory=lambda: datetime.datetime.now(tz=datetime.UTC),
    )
