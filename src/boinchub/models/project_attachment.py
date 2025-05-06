# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Project attachment model for BoincHub."""

import datetime

from fractions import Fraction
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from boinchub.core.database import Base

if TYPE_CHECKING:
    from boinchub.models.computer import Computer
    from boinchub.models.project import Project


class ProjectAttachment(Base):
    """Project attachment model for BoincHub."""

    __tablename__ = "project_attachments"
    __table_args_ = (UniqueConstraint("computer_id", "project_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, init=False)

    # Foreign keys
    computer_id: Mapped[int] = mapped_column(ForeignKey("computers.id"), init=False)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), init=False)

    # Relationships
    computer: Mapped["Computer"] = relationship(back_populates="project_attachments")
    project: Mapped["Project"] = relationship(back_populates="attachments")

    # Project-specific settings
    resource_share: Mapped[Fraction] = mapped_column(default=Fraction(100))
    suspended: Mapped[bool] = mapped_column(default=False)
    dont_request_more_work: Mapped[bool] = mapped_column(default=False)
    detach_when_done: Mapped[bool] = mapped_column(default=False)

    # Resource allocation settings
    no_cpu: Mapped[bool] = mapped_column(default=False)
    no_gpu_nvidia: Mapped[bool] = mapped_column(default=False)
    no_gpu_amd: Mapped[bool] = mapped_column(default=False)
    no_gpu_intel: Mapped[bool] = mapped_column(default=False)

    # Authentication
    authenticator: Mapped[str] = mapped_column(default="")

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), init=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), init=False)
