# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Service for project-related operations."""

from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from boinchub.models.project import Project


class ProjectCreate(BaseModel):
    """Model for creating a new project."""

    name: str
    url: str
    signed_url: str
    description: str
    admin_notes: str
    enabled: bool


class ProjectUpdate(BaseModel):
    """Model for updating a project."""

    name: str | None = None
    url: str | None = None
    signed_url: str | None = None
    description: str | None = None
    admin_notes: str | None = None
    enabled: bool | None = None


class ProjectService:
    """Service for project-related operations."""

    @staticmethod
    def create_project(db: Session, project_data: ProjectCreate) -> Project:
        """Create a new project.

        Args:
            db (Session): The database session.
            project_data (ProjectCreate): The data for the new project.

        Returns:
            The created project object.

        """
        db_project = Project(
            name=project_data.name,
            url=project_data.url,
            signed_url=project_data.signed_url,
            description=project_data.description,
            admin_notes=project_data.admin_notes,
            enabled=project_data.enabled,
        )

        db.add(db_project)
        db.commit()

        return db_project

    @staticmethod
    def get_project(db: Session, project_id: int) -> Project | None:
        """Get a project by ID.

        Args:
            db (Session): The database session.
            project_id (int): The ID of the project.

        Returns:
            The project object or None if not found.

        """
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def get_project_by_url(db: Session, project_url: str) -> Project | None:
        """Get a project by URL.

        Args:
            db (Session): The database session.
            project_url (str): The URL of the project.

        Returns:
            The project object or None if not found.

        """
        return db.query(Project).filter(Project.url == project_url).first()

    @staticmethod
    def get_projects(db: Session, skip: int = 0, limit: int = 100, *, enabled_only: bool = False) -> list[Project]:
        """Get a list of projects.

        Args:
            db (Session): The database session.
            skip (int): The number of projects to skip.
            limit (int): The maximum number of projects to return.
            enabled_only (bool): Whether to return only enabled projects.

        Returns:
            A list of project objects.

        """
        query = db.query(Project)

        if enabled_only:
            query = query.filter(Project.enabled)

        return query.order_by(func.lower(Project.name)).offset(skip).limit(limit).all()

    @staticmethod
    def update_project(db: Session, project_id: int, project_data: ProjectUpdate) -> Project | None:
        """Update a project.

        Args:
            db (Session): The database session.
            project_id (int): The ID of the project to update.
            project_data (ProjectUpdate): The data to update the project with.

        Returns:
            The updated project object or None if not found.

        """
        db_project = ProjectService.get_project(db, project_id)

        if not db_project:
            return None

        update_data = project_data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(db_project, key, value)

        db.commit()

        return db_project

    @staticmethod
    def delete_project(db: Session, project_id: int) -> bool:
        """Delete a project.

        Args:
            db (Session): The database session.
            project_id (int): The ID of the project to delete.

        Returns:
            True if the project was deleted, False otherwise.

        """
        db_project = ProjectService.get_project(db, project_id)

        if not db_project:
            return False

        db.delete(db_project)
        db.commit()

        return True
