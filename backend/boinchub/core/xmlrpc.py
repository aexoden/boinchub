# SPDX-FileCopyrightText: 2025-present Jason Lynch <jason@aexoden.com>
#
# SPDX-License-Identifier: MIT
"""BOINC XML RPC models."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import PlainSerializer
from pydantic_xml import BaseXmlModel, element, wrapped

from boinchub.core.settings import settings

BoolAsInt = Annotated[bool, PlainSerializer(lambda x: 1 if x else 0, return_type=int)]


class BoincError:
    """BOINC error codes."""

    ERR_XML_PARSE = -112
    ERR_BAD_USER_NAME = -188
    ERR_BAD_PASSWD = -206


class Account(BaseXmlModel, tag="account", search_mode="unordered"):
    """Account XML model."""

    url: str = element()
    url_signature: str = element()
    update: BoolAsInt | None = element(default=None)
    detach: BoolAsInt | None = element(default=None)
    dont_request_more_work: BoolAsInt | None = element(default=None)
    detach_when_done: BoolAsInt | None = element(default=None)
    suspend: BoolAsInt | None = element(default=None)
    no_cpu: BoolAsInt | None = element(default=None)
    no_cuda: BoolAsInt | None = element(default=None)
    no_ati: BoolAsInt | None = element(default=None)
    no_rsc: list[str] = element(default_factory=list)
    abort_not_started: BoolAsInt | None = element(default=None)
    authenticator: str = element()
    resource_share: Decimal | None = element(default=None)


class HostSpecific(BaseXmlModel, tag="host_specific"):
    """Host-specific XML model.

    This only exists because I have yet to find another way to represent a property that is True if the tag exists and
    false otherwise.
    """


class GlobalPreferences(BaseXmlModel, tag="global_preferences", search_mode="unordered"):
    """Global preferences XML model."""

    host_specific: HostSpecific | None = element(default=None)
    source_project: str | None = element(default=None)
    mod_time: Decimal | None = element(default=None)
    battery_charge_min_pct: Decimal | None = element(default=None)
    battery_max_temperature: Decimal | None = element(default=None)
    run_on_batteries: BoolAsInt | None = element(default=None)
    run_if_user_active: BoolAsInt | None = element(default=None)
    run_gpu_if_user_active: BoolAsInt | None = element(default=None)
    suspend_if_no_recent_input: Decimal | None = element(default=None)
    suspend_cpu_usage: Decimal | None = element(default=None)
    start_hour: Decimal | None = element(default=None)
    end_hour: Decimal | None = element(default=None)
    net_start_hour: Decimal | None = element(default=None)
    net_end_hour: Decimal | None = element(default=None)
    leave_apps_in_memory: BoolAsInt | None = element(default=None)
    confirm_before_connecting: BoolAsInt | None = element(default=None)
    hangup_if_dialed: BoolAsInt | None = element(default=None)
    dont_verify_images: BoolAsInt | None = element(default=None)
    work_buf_min_days: Decimal | None = element(default=None)
    work_buf_additional_days: Decimal | None = element(default=None)
    max_ncpus_pct: Decimal | None = element(default=None)
    niu_max_ncpus_pct: Decimal | None = element(default=None)
    niu_cpu_usage_limit: Decimal | None = element(default=None)
    niu_suspend_cpu_usage: Decimal | None = element(default=None)
    cpu_scheduling_period_minutes: Decimal | None = element(default=None)
    disk_interval: Decimal | None = element(default=None)
    disk_max_used_gb: Decimal | None = element(default=None)
    disk_max_used_pct: Decimal | None = element(default=None)
    disk_min_free_gb: Decimal | None = element(default=None)
    vm_max_used_pct: Decimal | None = element(default=None)
    ram_max_used_busy_pct: Decimal | None = element(default=None)
    ram_max_used_idle_pct: Decimal | None = element(default=None)
    idle_time_to_run: Decimal | None = element(default=None)
    max_bytes_sec_up: Decimal | None = element(default=None)
    max_bytes_sec_down: Decimal | None = element(default=None)
    cpu_usage_limit: Decimal | None = element(default=None)
    daily_xfer_limit_mb: Decimal | None = element(default=None)
    daily_xfer_period_days: int | None = element(default=None)
    override_file_present: BoolAsInt | None = element(default=None)
    network_wifi_only: BoolAsInt | None = element(default=None)
    max_cpus: int | None = element(default=None)


class HostInfo(BaseXmlModel, tag="host_info", search_mode="unordered"):
    """Host information XML model."""

    timezone: int = element()
    domain_name: str = element()
    ip_addr: str = element()
    host_cpid: str = element()
    p_ncpus: int = element()
    p_vendor: str = element()
    p_model: str = element()
    p_features: str = element()
    p_fpops: Decimal = element()
    p_iops: Decimal = element()
    p_membw: Decimal = element()
    p_calculated: Decimal = element()
    p_vm_extensions_disabled: BoolAsInt = element()
    m_nbytes: Decimal = element()
    m_cache: Decimal = element()
    m_swap: Decimal = element()
    d_total: Decimal = element()
    d_free: Decimal = element()
    os_name: str = element()
    os_version: str = element()
    n_usable_coprocs: int = element()
    wsl_available: BoolAsInt = element()
    virtualbox_version: str | None = element(default=None)


class Project(BaseXmlModel, tag="project", search_mode="unordered"):
    """Project XML model."""

    url: str = element()
    project_name: str = element()
    suspended_via_gui: BoolAsInt = element()
    hostid: int = element()
    not_started_dur: Decimal = element()
    in_progress_dur: Decimal = element()
    attached_via_acct_mgr: BoolAsInt = element()
    dont_request_more_work: BoolAsInt = element()
    detach_when_done: BoolAsInt = element()
    ended: BoolAsInt = element()
    resource_share: Decimal = element()
    disk_usage: Decimal = element()
    disk_share: Decimal = element()
    account_key: str | None = element(default=None)


class NetStats(BaseXmlModel, tag="net_stats", search_mode="unordered"):
    """Network statistics XML model."""

    bwup: Decimal = element()
    avg_up: Decimal = element()
    avg_time_up: Decimal = element()
    bwdown: Decimal = element()
    avg_down: Decimal = element()
    avg_time_down: Decimal = element()


class TimeStats(BaseXmlModel, tag="time_stats", search_mode="unordered"):
    """Time statistics XML model."""

    on_frac: Decimal = element()
    connected_frac: Decimal = element()
    cpu_and_network_available_frac: Decimal = element()
    active_frac: Decimal = element()
    gpu_active_frac: Decimal = element()
    client_start_time: Decimal = element()
    total_start_time: Decimal = element()
    total_duration: Decimal = element()
    total_active_duration: Decimal = element()
    total_gpu_active_duration: Decimal = element()
    now: Decimal = element()
    previous_uptime: Decimal = element()
    session_active_duration: Decimal = element()
    session_gpu_active_duration: Decimal = element()


class AccountManagerReply(BaseXmlModel, tag="acct_mgr_reply", search_mode="unordered"):
    """Account manager reply XML model."""

    error_num: int | None = element(default=None)
    error_msg: str | None = element(default=None)
    name: str = element(default=settings.account_manager_name)
    signing_key: str = element(default=settings.public_key)
    messages: list[str] = element(tag="message", default_factory=list)
    error: str | None = element(default=None)
    repeat_sec: int | None = element(default=None)
    no_project_notices: BoolAsInt | None = element(default=None)
    host_venue: str | None = element(default=None)
    accounts: list[Account] = element(default_factory=list)
    global_preferences: GlobalPreferences | None = element(default=None)
    uuid: UUID | None = wrapped("opaque", element(default=None), default=None)


class AccountManagerRequest(BaseXmlModel, tag="acct_mgr_request", search_mode="unordered"):
    """Account manager request XML model."""

    name: str = element()
    password_hash: str = element()
    host_cpid: str = element()
    domain_name: str = element()
    client_version: str = element()
    run_mode: str = element()
    platform_name: str = element()
    previous_host_cpid: str | None = element(default=None)
    uuid: UUID | None = wrapped("opaque", element(default=None))
    projects: list[Project] = element(default_factory=list)
    working_global_preferences: GlobalPreferences = wrapped("working_global_preferences", element())
    global_preferences: GlobalPreferences | None = element(default=None)
    host_info: HostInfo = element()
    time_stats: TimeStats = element()
    net_stats: NetStats = element()
