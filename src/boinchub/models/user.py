# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""User model for BoincHub."""

import datetime

from typing import TYPE_CHECKING

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from boinchub.core.database import Base

if TYPE_CHECKING:
    from boinchub.models.computer import Computer


class User(Base):
    """User model for BoincHub."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    username: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[str]
    boinc_password_hash: Mapped[str]
    email: Mapped[str]

    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), init=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), init=False)

    computers: Mapped[list["Computer"]] = relationship(
        default_factory=list, back_populates="user", cascade="all, delete-orphan"
    )
