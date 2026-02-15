# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Database module for BoincHub."""

from collections.abc import Generator

from sqlmodel import Session, create_engine

from boinchub.core.settings import settings

engine = create_engine(settings.database_url)


def get_db() -> Generator[Session]:
    """Get a database session.

    Yields:
        A database session object.
    """
    with Session(engine) as session:
        yield session
