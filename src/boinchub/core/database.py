# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Database module for BoincHub."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass, Session, sessionmaker

from boinchub.core.settings import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(MappedAsDataclass, DeclarativeBase):
    """Base class for SQLAlchemy models."""


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
