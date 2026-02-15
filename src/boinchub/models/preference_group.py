# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""Preference group model for BoincHub."""

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from boinchub.models.user import User
from boinchub.models.util import Timestamps

if TYPE_CHECKING:
    from boinchub.models.computer import Computer


class PreferenceGroupBase(SQLModel):
    """Preference group base model."""

    # Foreign keys
    user_id: UUID | None = Field(default=None, foreign_key="users.id", ondelete="CASCADE", index=True)

    # Group metadata
    name: str = Field(index=True)
    description: str = Field(default="")
    is_default: bool = Field(default=False, index=True)

    # Battery settings
    battery_charge_min_pct: Decimal = Field(default=90, max_digits=9, decimal_places=6, ge=0, le=100)
    battery_max_temperature: Decimal = Field(default=40, max_digits=9, decimal_places=6, ge=0, lt=1000)
    run_on_batteries: bool = Field(default=False)

    # Activity settings
    run_if_user_active: bool = Field(default=True)
    run_gpu_if_user_active: bool = Field(default=False)
    suspend_if_no_recent_input: Decimal = Field(default=0, max_digits=18, decimal_places=6, ge=0)
    idle_time_to_run: Decimal = Field(default=3, max_digits=18, decimal_places=6, ge=0)

    # Time restrictions
    start_hour: Decimal = Field(default=0, max_digits=8, decimal_places=6, ge=0, lt=24)
    end_hour: Decimal = Field(default=0, max_digits=8, decimal_places=6, ge=0, lt=24)
    net_start_hour: Decimal = Field(default=0, max_digits=8, decimal_places=6, ge=0, lt=24)
    net_end_hour: Decimal = Field(default=0, max_digits=8, decimal_places=6, ge=0, lt=24)

    # Memory and processing settings
    leave_apps_in_memory: bool = Field(default=False)
    max_ncpus_pct: Decimal = Field(default=0, max_digits=9, decimal_places=6, ge=0, le=100)
    niu_max_ncpus_pct: Decimal = Field(default=100, max_digits=9, decimal_places=6, ge=0, le=100)
    cpu_usage_limit: Decimal = Field(default=100, max_digits=9, decimal_places=6, ge=0, le=100)
    niu_cpu_usage_limit: Decimal = Field(default=100, max_digits=9, decimal_places=6, ge=0, le=100)
    suspend_cpu_usage: Decimal = Field(default=25, max_digits=9, decimal_places=6, ge=0, le=100)
    niu_suspend_cpu_usage: Decimal = Field(default=50, max_digits=9, decimal_places=6, ge=0, le=100)
    cpu_scheduling_period_minutes: Decimal = Field(default=60, max_digits=18, decimal_places=6, gt=0)
    max_cpus: int = Field(default=0, ge=0)

    # Work buffer settings
    work_buf_min_days: Decimal = Field(default=0.1, max_digits=18, decimal_places=6, ge=0)
    work_buf_additional_days: Decimal = Field(default=0.5, max_digits=18, decimal_places=6, ge=0)

    # Disk usage settings
    disk_interval: Decimal = Field(default=60, max_digits=18, decimal_places=6, gt=0)
    disk_max_used_gb: Decimal = Field(default=0, max_digits=18, decimal_places=6, ge=0)
    disk_max_used_pct: Decimal = Field(default=90, max_digits=9, decimal_places=6, ge=0, le=100)
    disk_min_free_gb: Decimal = Field(default=0.1, max_digits=18, decimal_places=6, ge=0)

    # Memory usage settings
    vm_max_used_pct: Decimal = Field(default=75, max_digits=9, decimal_places=6, ge=0, le=100)
    ram_max_used_busy_pct: Decimal = Field(default=50, max_digits=9, decimal_places=6, ge=0, le=100)
    ram_max_used_idle_pct: Decimal = Field(default=90, max_digits=9, decimal_places=6, ge=0, le=100)

    # Network settings
    confirm_before_connecting: bool = Field(default=True)
    hangup_if_dialed: bool = Field(default=False)
    max_bytes_sec_up: Decimal = Field(default=0, max_digits=18, decimal_places=6, ge=0)
    max_bytes_sec_down: Decimal = Field(default=0, max_digits=18, decimal_places=6, ge=0)
    daily_xfer_limit_mb: Decimal = Field(default=0, max_digits=18, decimal_places=6, ge=0)
    daily_xfer_period_days: int = Field(default=0, ge=0)
    network_wifi_only: bool = Field(default=False)

    # Other settings
    dont_verify_images: bool = Field(default=False)


class PreferenceGroup(PreferenceGroupBase, Timestamps, table=True):
    """Preference group model."""

    # SQLAlchemy table name
    __tablename__: str = "preference_groups"  # type: ignore[misc]

    # Primary key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Relationships
    computers: list["Computer"] = Relationship(back_populates="preference_group")
    user: User | None = Relationship(back_populates="preference_groups")


class PreferenceGroupPublic(PreferenceGroupBase, Timestamps):
    """Public preference group model for API responses."""

    # Primary key
    id: UUID


class PreferenceGroupCreate(PreferenceGroupBase):
    """Model for creating a new preference group."""


class PreferenceGroupUpdate(SQLModel):
    """Model for updating a preference group."""

    # Group metadata
    name: str | None = None
    description: str | None = None
    is_default: bool | None = None

    # Battery settings
    battery_charge_min_pct: Decimal | None = None
    battery_max_temperature: Decimal | None = None
    run_on_batteries: bool | None = None

    # Activity settings
    run_if_user_active: bool | None = None
    run_gpu_if_user_active: bool | None = None
    suspend_if_no_recent_input: Decimal | None = None
    idle_time_to_run: Decimal | None = None

    # Time restrictions
    start_hour: Decimal | None = None
    end_hour: Decimal | None = None
    net_start_hour: Decimal | None = None
    net_end_hour: Decimal | None = None

    # Memory and processing settings
    leave_apps_in_memory: bool | None = None
    max_ncpus_pct: Decimal | None = None
    niu_max_ncpus_pct: Decimal | None = None
    cpu_usage_limit: Decimal | None = None
    niu_cpu_usage_limit: Decimal | None = None
    suspend_cpu_usage: Decimal | None = None
    niu_suspend_cpu_usage: Decimal | None = None
    cpu_scheduling_period_minutes: Decimal | None = None
    max_cpus: int | None = None

    # Work buffer settings
    work_buf_min_days: Decimal | None = None
    work_buf_additional_days: Decimal | None = None

    # Disk usage settings
    disk_interval: Decimal | None = None
    disk_max_used_gb: Decimal | None = None
    disk_max_used_pct: Decimal | None = None
    disk_min_free_gb: Decimal | None = None

    # Memory usage settings
    vm_max_used_pct: Decimal | None = None
    ram_max_used_busy_pct: Decimal | None = None
    ram_max_used_idle_pct: Decimal | None = None

    # Network settings
    confirm_before_connecting: bool | None = None
    hangup_if_dialed: bool | None = None
    max_bytes_sec_up: Decimal | None = None
    max_bytes_sec_down: Decimal | None = None
    daily_xfer_limit_mb: Decimal | None = None
    daily_xfer_period_days: int | None = None
    network_wifi_only: bool | None = None

    # Other settings
    dont_verify_images: bool | None = None
