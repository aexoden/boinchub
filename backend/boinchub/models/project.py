# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Project model for BoincHub."""

import datetime

from typing import TYPE_CHECKING

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from boinchub.core.database import Base

if TYPE_CHECKING:
    from boinchub.models.project_attachment import ProjectAttachment


class Project(Base):
    """Project model for Boinchub."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    name: Mapped[str]
    url: Mapped[str] = mapped_column(unique=True)
    signed_url: Mapped[str] = mapped_column(default="")
    description: Mapped[str] = mapped_column(default="")
    admin_notes: Mapped[str] = mapped_column(default="")

    enabled: Mapped[bool] = mapped_column(default=True)

    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), init=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), init=False)

    attachments: Mapped[list["ProjectAttachment"]] = relationship(
        default_factory=list, back_populates="project", cascade="all, delete-orphan"
    )
