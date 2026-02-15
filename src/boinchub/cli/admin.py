# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
# ruff: noqa: T201
"""Command-line interface for BoincHub administration."""

import argparse
import getpass
import sys

from pydantic import ValidationError
from sqlmodel import Session

from boinchub.core.database import engine
from boinchub.core.settings import settings
from boinchub.models.user import UserCreate, UserUpdate
from boinchub.services.user_service import UserService


def create_admin(username: str, email: str, password: str | None = None, *, super_admin: bool = False) -> bool:
    """Create an admin user.

    Args:
        username (str): The username of the admin.
        email (str): The email of the admin.
        password (str | None): The password of the admin. If None, prompt for a password.
        super_admin (bool): Whether to create a super admin user. Defaults to False.

    Returns:
        bool: True if the admin was created successfully, False otherwise.
    """
    if password is None:
        password = getpass.getpass("Enter password: ")
        password_confirm = getpass.getpass("Confirm password: ")

        if password != password_confirm:
            print("Passwords do not match.")
            return False

    if len(password) < settings.min_password_length:
        print(f"Password must be at least {settings.min_password_length} characters long.")
        return False

    with Session(engine) as db:
        user_service = UserService(db)

        try:
            existing_user = user_service.get_by_username(username)

            if existing_user:
                print(f"User '{username}' already exists.")
                return False

            role = "super_admin" if super_admin else "admin"

            user_count = len(user_service.get_all())
            if user_count == 0:
                role = "super_admin"
                print("Creating first user as super admin.")

            user_data = UserCreate(
                username=username,
                password=password,
                email=email,
                role=role,
                invite_code=None,  # Invite code is not used in CLI
            )

            user = user_service.create(user_data)
            role_text = "Super admin" if user.role == "super_admin" else "Admin"
            print(f"{role_text} user '{user.username}' created successfully.")
        except ValidationError as e:
            print(f"Validation error: {e}")
            return False
        except Exception as e:  # noqa: BLE001
            print(f"Error creating admin user: {e}")
            return False
        else:
            return True


def promote_user(username: str) -> bool:
    """Promote a user to super admin.

    Args:
        username (str): The username of the user to promote.

    Returns:
        bool: True if the user was promoted successfully, False otherwise.

    """
    with Session(engine) as db:
        user_service = UserService(db)

        try:
            user = user_service.get_by_username(username)

            if not user:
                print(f"User '{username}' not found.")
                return False

            if user.role == "super_admin":
                print(f"User '{username}' is already a super admin.")
                return False

            update_data = UserUpdate(role="super_admin")

            updated_user = user_service.update(user.id, update_data)

            if updated_user:
                print(f"User '{username}' promoted to super admin successfully.")
                return True

            print(f"Failed to promote user '{username}'.")
        except Exception as e:  # noqa: BLE001
            print(f"Error promoting user: {e}")

        return False


def list_users() -> bool:
    """List all users with their roles.

    Returns:
        bool: True if successful, False otherwise.

    """
    with Session(engine) as db:
        user_service = UserService(db)

        try:
            users = user_service.get_all()

            if not users:
                print("No users found.")
                return True

            print("\nUsers:")
            print("-" * 60)
            print(f"{'Username':<20} {'Email':<30} {'Role':<12} {'Active'}")
            print("-" * 60)

            for user in users:
                active_status = "Yes" if user.is_active else "No"
                print(f"{user.username:<20} {user.email:<30} {user.role:<12} {active_status}")
        except Exception as e:  # noqa: BLE001
            print(f"Error listing users: {e}")
            return False
        else:
            return True


def main() -> None:
    """Execute the command-line interface for BoincHub administration."""
    parser = argparse.ArgumentParser(description="BoincHub Admin CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Create admin command
    create_admin_parser = subparsers.add_parser("create-admin", help="Create an admin user")
    create_admin_parser.add_argument("username", type=str, help="Username for the admin user")
    create_admin_parser.add_argument("email", help="Email for the admin user")
    create_admin_parser.add_argument(
        "--password", type=str, help="Password for the admin user (if not provided, will prompt)"
    )
    create_admin_parser.add_argument(
        "--super-admin", action="store_true", help="Create a super admin user instead of regular admin"
    )

    # Promote user command
    promote_parser = subparsers.add_parser("promote", help="Promote a user to super admin")
    promote_parser.add_argument("username", type=str, help="Username to promote to super admin")

    # List users command
    subparsers.add_parser("list-users", help="List all users")

    args = parser.parse_args()

    if args.command == "create-admin":
        success = create_admin(args.username, args.email, args.password)
        if not success:
            sys.exit(1)
    elif args.command == "promote":
        success = promote_user(args.username)
        if not success:
            sys.exit(1)
    elif args.command == "list-users":
        success = list_users()
        if not success:
            sys.exit(1)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
