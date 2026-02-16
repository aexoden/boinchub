# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Base service class for common CRUD operations."""

from typing import TYPE_CHECKING, Any

from sqlmodel import Session, SQLModel, select

if TYPE_CHECKING:
    from uuid import UUID


class BaseService[ModelType: SQLModel, CreateType: SQLModel, UpdateType: SQLModel]:
    """Base service class for common CRUD operations."""

    model: type[ModelType]

    def __init__(self, db: Session) -> None:
        """Initialize the BaseService with a database session.

        Args:
            db (Session): The database session to use for operations.

        """
        self.db = db

    def get(self, object_id: UUID) -> ModelType | None:
        """Get an object by ID.

        Args:
            object_id (UUID): The ID of the object to retrieve.

        Returns:
            ModelType | None: The model instance if found, otherwise None.

        """
        return self.db.get(self.model, object_id)

    def get_all(
        self,
        offset: int = 0,
        limit: int = 100,
        order_by: str | None = None,
        **filters: Any,  # noqa: ANN401
    ) -> list[ModelType]:
        """Get all model instances with optional filters.

        Args:
            offset (int, optional): The offset for pagination. Defaults to 0.
            limit (int, optional): The maximum number of results to return. Defaults to 100.
            order_by (str, optional): The field to order results by. Defaults to None.
            **filters: Additional filters to apply.

        Returns:
            list[ModelType]: A list of model instances matching the filters.

        """
        query = select(self.model)

        # Apply filters if provided
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.where(getattr(self.model, field) == value)

        # Apply ordering if specified
        if order_by and hasattr(self.model, order_by):
            query = query.order_by(getattr(self.model, order_by))

        return list(self.db.exec(query.offset(offset).limit(limit)).all())

    def create(self, object_data: CreateType) -> ModelType:
        """Create a new model instance.

        Args:
            object_data (CreateType): The data to create the new model instance.

        Returns:
            ModelType: The created model instance.

        """
        object_instance = self.model.model_validate(object_data)

        self.db.add(object_instance)
        self.db.commit()
        self.db.refresh(object_instance)

        return object_instance

    def update(self, object_id: UUID, object_data: UpdateType) -> ModelType | None:
        """Update an existing model instance.

        Args:
            object_id (UUID): The ID of the object to update.
            object_data (UpdateType): The data to update the model instance with.

        Returns:
            ModelType | None: The updated model instance if found, otherwise None.

        """
        object_instance = self.get(object_id)

        if object_instance:
            update_data = object_data.model_dump(exclude_none=True)
            object_instance.sqlmodel_update(update_data)

            self.db.add(object_instance)
            self.db.commit()
            self.db.refresh(object_instance)

        return object_instance

    def delete(self, object_id: UUID) -> bool:
        """Delete a model instance by ID.

        Args:
            object_id (UUID): The ID of the object to delete.

        Returns:
            bool: True if the object existed and was deleted, False otherwise.

        """
        object_instance = self.get(object_id)

        if not object_instance:
            return False

        self.db.delete(object_instance)
        self.db.commit()
        return True
