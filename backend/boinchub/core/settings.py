# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Application settings module."""

import warnings

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MINIMUM_SECRET_KEY_LENGTH = 32
MINIMUM_ENCRYPTION_KEY_LENGTH = 32


class Settings(BaseSettings):
    """Application settings."""

    # Configuration
    model_config = SettingsConfigDict(env_file="../.env", env_ignore_empty=True, env_prefix="BOINCHUB_", extra="ignore")

    # Server settings
    host: str = "localhost"
    port: int = 8500

    # Database settings
    database_url: str = "postgresql+psycopg2://postgres:password@localhost/boinchub"

    # Account manager settings
    account_manager_name: str = "BoincHub"
    backend_url: str = "http://localhost:8500"
    frontend_url: str = "http://localhost:8501"
    min_username_length: int = 3
    max_username_length: int = 50
    min_password_length: int = 16
    require_invite_code: bool = False

    # Signing key settings
    public_key: str = "INVALID PUBLIC KEY"

    # JWT settings
    secret_key: str = ""
    access_token_expire_minutes: int = 30

    # Encryption settings for account keys
    master_encryption_key: str = ""
    encryption_salt: str = "boinchub_account_keys_salt_v1"

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        """Validate that the secret key is set and sufficiently complex.

        Args:
            value (str): The secret key to validate.

        Returns:
            str: The validated secret key.

        Raises:
            ValueError: If the secret key is not set or is too short.

        """
        if not value:
            msg = "SECRET_KEY must be set for security"
            raise ValueError(msg)

        if len(value) < MINIMUM_SECRET_KEY_LENGTH:
            msg = f"SECRET_KEY must be at least {MINIMUM_SECRET_KEY_LENGTH} characters long"
            raise ValueError(msg)

        return value

    @field_validator("master_encryption_key")
    @classmethod
    def validate_master_encryption_key(cls, value: str) -> str:
        """Validate that the master encryption key is set and sufficiently complex.

        Args:
            value (str): The master encryption key to validate.

        Returns:
            str: The validated master encryption key.

        Raises:
            ValueError: If the master encryption key is not set or is too short.

        """
        if not value:
            msg = "MASTER_ENCRYPTION_KEY must be set for account key encryption"
            raise ValueError(msg)

        if len(value) < MINIMUM_ENCRYPTION_KEY_LENGTH:
            msg = f"MASTER_ENCRYPTION_KEY must be at least {MINIMUM_ENCRYPTION_KEY_LENGTH} characters long"
            raise ValueError(msg)

        return value

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        """Warn about databases other than PostgreSQL.

        Args:
            value (str): The database URL to validate.

        Returns:
            str: The validated database URL.

        """
        if not value.startswith("postgresql"):
            warnings.warn(
                "Using a non-PostgreSQL database is not recommended. BoincHub is optimized for PostgreSQL.",
                UserWarning,
                stacklevel=2,
            )

        return value


settings = Settings()
