# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Database module for BoincHub."""

import datetime

from collections.abc import Generator
from fractions import Fraction
from typing import Any, ClassVar

from sqlalchemy import TIMESTAMP, Dialect, String, create_engine
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass, Session, sessionmaker
from sqlalchemy.types import TypeDecorator

from boinchub.core.settings import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class FractionType(TypeDecorator[Fraction]):
    """SQLAlchemy type for storing fractions.Fraction objects as strings in the database."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value: Fraction | None, dialect: Dialect) -> str | None:  # noqa: ARG002, PLR6301
        """Convert Fraction to string when saving to database.

        Args:
            value (Fraction | None): The Fraction value to convert.
            _dialect (Dialect): The SQLAlchemy dialect.

            Returns:
                str | None: The string representation of the Fraction or None.

        """
        if value is None:
            return None

        return str(value)

    def process_result_value(self, value: str | None, dialect: Dialect) -> Fraction | None:  # noqa: ARG002, PLR6301
        """Convert string to Fraction when retrieving from database.

        Args:
            value (str | None): The string value to convert.
            _dialect (Dialect): The SQLAlchemy dialect.

        Returns:
            Fraction | None: The Fraction object or None.

        """
        if value is None:
            return None

        return Fraction(value)


class Base(MappedAsDataclass, DeclarativeBase):
    """Base class for SQLAlchemy models."""

    type_annotation_map: ClassVar[dict[Any, Any]] = {
        datetime.datetime: TIMESTAMP(timezone=True),
        Fraction: FractionType(),
    }


def get_db() -> Generator[Session]:
    """Get a database session.

    Yields:
        A database session object.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
