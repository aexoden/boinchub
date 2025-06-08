# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Application settings module."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # Configuration
    model_config = SettingsConfigDict(env_file="../.env", env_ignore_empty=True, env_prefix="BOINCHUB_", extra="ignore")

    # Server settings
    host: str = "localhost"
    port: int = 8500

    # Database settings
    database_url: str = "sqlite:///./boinchub.db"

    # Account manager settings
    account_manager_name: str = "BoincHub"
    account_manager_url: str = "http://localhost:8500"
    min_password_length: int = 16

    # Signing key settings
    public_key: str = "INVALID SIGNING KEY"

    # JWT settings
    secret_key: str = ""
    access_token_expire_minutes: int = 30


settings = Settings()
