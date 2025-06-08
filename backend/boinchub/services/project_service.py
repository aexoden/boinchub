# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for project-related operations."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from sqlmodel import Session, select

from boinchub.core.database import get_db
from boinchub.models.project import Project, ProjectCreate, ProjectUpdate


class ProjectService:
    """Service for project-related operations."""

    def __init__(self, db: Session) -> None:
        """Initialize the ProjectService with a database session."""
        self.db = db

    def create_project(self, project_data: ProjectCreate) -> Project:
        """Create a new project.

        Args:
            project_data (ProjectCreate): The data for the new project.

        Returns:
            Project: The created project object.

        """
        project = Project.model_validate(project_data)

        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)

        return project

    def delete_project(self, project_id: UUID) -> bool:
        """Delete a project by ID.

        Args:
            project_id (UUID): The ID of the project to delete.

        Returns:
            bool: True if the project exists and was deleted, False otherwise.

        """
        project = self.get_project(project_id)

        if not project:
            return False

        self.db.delete(project)
        self.db.commit()

        return True

    def get_project(self, project_id: UUID) -> Project | None:
        """Get a project by ID.

        Args:
            project_id (UUID): The ID of the project.

        Returns:
            Project | None: The project object if found, None otherwise.

        """
        return self.db.get(Project, project_id)

    def get_project_by_url(self, project_url: str) -> Project | None:
        """Get a project by URL.

        Args:
            project_url (str): The URL of the project.

        Returns:
            Project | None: The project object if found, None otherwise.

        """
        return self.db.exec(select(Project).where(Project.url == project_url)).first()

    def get_projects(self, offset: int = 0, limit: int = 100, *, enabled_only: bool = False) -> list[Project]:
        """Get a list of projects.

        Args:
            offset (int): The number of projects to skip.
            limit (int: The maximum number of projects to return.
            enabled_only (bool): Whether to return only enabled projects.

        Returns:
            list[Project]: A list of project objects.

        """
        query = select(Project)

        if enabled_only:
            query = query.where(Project.enabled == True)  # noqa: E712

        return list(self.db.exec(query.order_by(Project.name).offset(offset).limit(limit)).all())

    def update_project(self, project_id: UUID, project_data: ProjectUpdate) -> Project | None:
        """Update a project.

        Args:
            project_id (UUID): The ID of the project to update.
            project_data (ProjectUpdate): The data to update the project with.

        Returns:
            Project | None: The updated project object if found, None otherwise.

        """
        project = self.get_project(project_id)

        if project:
            update_data = project_data.model_dump(exclude_none=True)
            project.sqlmodel_update(update_data)

            self.db.add(project)
            self.db.commit()
            self.db.refresh(project)

        return project


def get_project_service(db: Annotated[Session, Depends(get_db)]) -> ProjectService:
    """Get an instance of the ProjectService.

    Args:
        db (Session): The database session to use.

    Returns:
        ProjectService: An instance of the project service.

    """
    return ProjectService(db)
