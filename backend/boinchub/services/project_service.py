# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for project-related operations."""

from typing import Annotated, Any

from fastapi import Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.models.project import Project, ProjectCreate, ProjectUpdate
from boinchub.services.base_service import BaseService


class ProjectService(BaseService[Project, ProjectCreate, ProjectUpdate]):
    """Service for project-related operations."""

    model = Project

    def get_all(self, offset: int = 0, limit: int = 100, order_by: str | None = None, **filters: Any) -> list[Project]:  # noqa: ANN401
        """Get a list of projects.

        Args:
            offset (int): The number of projects to skip.
            limit (int: The maximum number of projects to return.
            order_by (str | None): The field to order the projects by.
            **filters: Additional filters to apply to the query.

        Returns:
            list[Project]: A list of project objects.

        """
        return super().get_all(offset=offset, limit=limit, order_by=order_by or "name", **filters)

    def get_by_url(self, project_url: str) -> Project | None:
        """Get a project by URL.

        Args:
            project_url (str): The URL of the project.

        Returns:
            Project | None: The project object if found, None otherwise.

        """
        return self.db.exec(select(Project).where(Project.url == project_url)).first()

    def get_enabled(self, offset: int = 0, limit: int = 100) -> list[Project]:
        """Get a list of enabled projects.

        Args:
            offset (int): The number of projects to skip.
            limit (int): The maximum number of projects to return.

        Returns:
            list[Project]: A list of enabled project objects.

        """
        return self.get_all(offset=offset, limit=limit, enabled=True)


def get_project_service(db: Annotated[Session, Depends(get_db)]) -> ProjectService:
    """Get an instance of the ProjectService.

    Args:
        db (Session): The database session to use.

    Returns:
        ProjectService: An instance of the project service.

    """
    return ProjectService(db)
