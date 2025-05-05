# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Computer model for BoincHub."""

import datetime
import uuid

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from boinchub.core.database import Base

if TYPE_CHECKING:
    from boinchub.models.user import User


class Computer(Base):
    """Computer model for BoincHub."""

    __tablename__ = "computers"
    __table_args__ = (UniqueConstraint("user_id", "cpid"),)

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    uuid: Mapped[UUID] = mapped_column(default=uuid.uuid4, unique=True, init=False)
    cpid: Mapped[str]
    domain_name: Mapped[str]
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), init=False
    )
    last_seen_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), init=False
    )

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    user: Mapped["User"] = relationship(back_populates="computers")
