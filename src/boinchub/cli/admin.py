# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
# ruff: noqa: T201
"""Command-line interface for BoincHub administration."""

import argparse
import getpass
import sys

from typing import TYPE_CHECKING

from boinchub.core.database import SessionLocal
from boinchub.services.user_service import UserCreate, UserService

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


def create_admin(username: str, email: str, password: str | None = None) -> bool:
    """Create an admin user.

    Args:
        username (str): The username of the admin.
        email (str): The email of the admin.
        password (str | None): The password of the admin. If None, prompt for a password.

    Returns:
        bool: True if the admin was created successfully, False otherwise.
    """
    if password is None:
        password = getpass.getpass("Enter password: ")
        password_confirm = getpass.getpass("Confirm password: ")

        if password != password_confirm:
            print("Passwords do not match.")
            return False

    db: Session = SessionLocal()

    try:
        existing_user = UserService.get_user_by_username(db, username)

        if existing_user:
            print(f"User '{username}' already exists.")
            return False

        user_data = UserCreate(
            username=username,
            password=password,
            email=email,
            role="admin",
        )

        user = UserService.create_user(db, user_data)
        print(f"Admin user '{user.username}' created successfully.")
    except Exception as e:  # noqa: BLE001
        print(f"Error creating admin user: {e}")
        return False
    else:
        return True
    finally:
        db.close()


def main() -> None:
    """Execute the command-line interface for BoincHub administration."""
    parser = argparse.ArgumentParser(description="BoincHub Admin CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    create_admin_parser = subparsers.add_parser("create-admin", help="Create an admin user")
    create_admin_parser.add_argument("username", type=str, help="Username for the admin user")
    create_admin_parser.add_argument("email", help="Email for the admin user")
    create_admin_parser.add_argument(
        "--password", type=str, help="Password for the admin user (if not provided, will prompt)"
    )

    args = parser.parse_args()

    if args.command == "create-admin":
        success = create_admin(args.username, args.email, args.password)
        if not success:
            sys.exit(1)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
