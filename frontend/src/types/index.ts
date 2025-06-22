// User related types
export interface User {
    id: string;
    username: string;
    email: string;
    role: "user" | "admin" | "super_admin";
    is_active: boolean;
}

export interface UserCredentials {
    username: string;
    password: string;
}

export interface UserRegister extends UserCredentials {
    email: string;
    invite_code?: string;
}

export interface UserUpdate {
    username?: string;
    email?: string;
    password?: string;
    boinc_password?: string;
    role?: "user" | "admin" | "super_admin";
    is_active?: boolean;
    current_password?: string; // For validation purposes
}

// Session related types
export interface UserSession {
    id: string;
    user_id: string;
    device_name: string;
    device_fingerprint: string;
    user_agent: string;
    ip_address: string;
    is_active: boolean;
    last_accessed_at: string;
    created_at: string;
    updated_at: string;
    is_current?: boolean;
}

// Computer related types
export interface Computer {
    id: string;
    cpid: string;
    hostname: string;
    user_id: string;
    preference_group_id: string;
    created_at: string;
    updated_at: string;
    last_connected_at: string | null;
}

export interface ComputerUpdate {
    preference_group_id?: string;
}

// Invite code related types
export interface InviteCode {
    id: string;
    code: string;
    is_active: boolean;
    created_by_user_id: string;
    used_by_user_id: string | null;
    used_at: string | null;
    created_at: string;
    updated_at: string;
    created_by_username?: string;
    used_by_username?: string;
}

export interface InviteCodeCreate {
    code?: string; // Optional, will be generated if not provided
}

export interface InviteCodeUpdate {
    is_active?: boolean;
}

// Project related types
export interface Project {
    id: string;
    name: string;
    url: string;
    signed_url: string;
    description: string;
    admin_notes: string;
    enabled: boolean;
}

export interface ProjectCreate {
    name: string;
    url: string;
    signed_url: string;
    description: string;
    admin_notes: string;
    enabled: boolean;
}

export interface ProjectUpdate {
    name?: string;
    url?: string;
    signed_url?: string;
    description?: string;
    admin_notes?: string;
    enabled?: boolean;
}

// User Project Key related types
export interface UserProjectKey {
    id: string;
    user_id: string;
    project_id: string;
    account_key: string;
    created_at: string;
    updated_at: string;
}

export interface UserProjectKeyWithProject extends UserProjectKey {
    project_name: string;
    project_url: string;
}

export interface UserProjectKeyRequest {
    project_id: string;
    account_key: string;
}

// Project Attachment related types
export interface ProjectAttachment {
    id: string;
    computer_id: string;
    project_id: string;
    resource_share: number;
    suspended: boolean;
    dont_request_more_work: boolean;
    detach_when_done: boolean;
    no_cpu: boolean;
    no_gpu_nvidia: boolean;
    no_gpu_amd: boolean;
    no_gpu_intel: boolean;
}

export interface ProjectAttachmentCreate {
    computer_id: string;
    project_id: string;
    resource_share?: number;
    suspended?: boolean;
    dont_request_more_work?: boolean;
    detach_when_done?: boolean;
    no_cpu?: boolean;
    no_gpu_nvidia?: boolean;
    no_gpu_amd?: boolean;
    no_gpu_intel?: boolean;
}

export interface ProjectAttachmentUpdate {
    resource_share?: number;
    suspended?: boolean;
    dont_request_more_work?: boolean;
    detach_when_done?: boolean;
    no_cpu?: boolean;
    no_gpu_nvidia?: boolean;
    no_gpu_amd?: boolean;
    no_gpu_intel?: boolean;
}

// Authentication related types
export interface TokenPair {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface ErrorResponse {
    detail: string;
}

export class ApiError extends Error {
    public status: number;
    public detail?: string;

    constructor(status: number, message: string, detail?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.detail = detail;
    }
}

// Preference Group related types
export interface PreferenceGroup {
    id: string;
    user_id: string | null;
    name: string;
    description: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;

    // Battery settings
    battery_charge_min_pct: number;
    battery_max_temperature: number;
    run_on_batteries: boolean;

    // Activity settings
    run_if_user_active: boolean;
    run_gpu_if_user_active: boolean;
    suspend_if_no_recent_input: number;
    idle_time_to_run: number;

    // Time restrictions
    start_hour: number;
    end_hour: number;
    net_start_hour: number;
    net_end_hour: number;

    // Memory and processing settings
    leave_apps_in_memory: boolean;
    max_ncpus_pct: number;
    niu_max_ncpus_pct: number;
    cpu_usage_limit: number;
    niu_cpu_usage_limit: number;
    suspend_cpu_usage: number;
    niu_suspend_cpu_usage: number;
    cpu_scheduling_period_minutes: number;
    max_cpus: number;

    // Work buffer settings
    work_buf_min_days: number;
    work_buf_additional_days: number;

    // Disk usage settings
    disk_interval: number;
    disk_max_used_gb: number;
    disk_max_used_pct: number;
    disk_min_free_gb: number;

    // Memory usage settings
    vm_max_used_pct: number;
    ram_max_used_busy_pct: number;
    ram_max_used_idle_pct: number;

    // Network settings
    confirm_before_connecting: boolean;
    hangup_if_dialed: boolean;
    max_bytes_sec_up: number;
    max_bytes_sec_down: number;
    daily_xfer_limit_mb: number;
    daily_xfer_period_days: number;
    network_wifi_only: boolean;

    // Other settings
    dont_verify_images: boolean;
}
export interface PreferenceGroupCreate {
    name: string;
    description: string;
    is_default: boolean;

    // Battery settings
    battery_charge_min_pct: number;
    battery_max_temperature: number;
    run_on_batteries: boolean;

    // Activity settings
    run_if_user_active: boolean;
    run_gpu_if_user_active: boolean;
    suspend_if_no_recent_input: number;
    idle_time_to_run: number;

    // Time restrictions
    start_hour: number;
    end_hour: number;
    net_start_hour: number;
    net_end_hour: number;

    // Memory and processing settings
    leave_apps_in_memory: boolean;
    max_ncpus_pct: number;
    niu_max_ncpus_pct: number;
    cpu_usage_limit: number;
    niu_cpu_usage_limit: number;
    suspend_cpu_usage: number;
    niu_suspend_cpu_usage: number;
    cpu_scheduling_period_minutes: number;
    max_cpus: number;

    // Work buffer settings
    work_buf_min_days: number;
    work_buf_additional_days: number;

    // Disk usage settings
    disk_interval: number;
    disk_max_used_gb: number;
    disk_max_used_pct: number;
    disk_min_free_gb: number;

    // Memory usage settings
    vm_max_used_pct: number;
    ram_max_used_busy_pct: number;
    ram_max_used_idle_pct: number;

    // Network settings
    confirm_before_connecting: boolean;
    hangup_if_dialed: boolean;
    max_bytes_sec_up: number;
    max_bytes_sec_down: number;
    daily_xfer_limit_mb: number;
    daily_xfer_period_days: number;
    network_wifi_only: boolean;

    // Other settings
    dont_verify_images: boolean;
}

export interface PreferenceGroupUpdate {
    name?: string;
    description?: string;
    is_default?: boolean;

    battery_charge_min_pct?: number;
    battery_max_temperature?: number;
    run_on_batteries?: boolean;

    // Activity settings
    run_if_user_active?: boolean;
    run_gpu_if_user_active?: boolean;
    suspend_if_no_recent_input?: number;
    idle_time_to_run?: number;

    // Time restrictions
    start_hour?: number;
    end_hour?: number;
    net_start_hour?: number;
    net_end_hour?: number;

    // Memory and processing settings
    leave_apps_in_memory?: boolean;
    max_ncpus_pct?: number;
    niu_max_ncpus_pct?: number;
    cpu_usage_limit?: number;
    niu_cpu_usage_limit?: number;
    suspend_cpu_usage?: number;
    niu_suspend_cpu_usage?: number;
    cpu_scheduling_period_minutes?: number;
    max_cpus?: number;

    // Work buffer settings
    work_buf_min_days?: number;
    work_buf_additional_days?: number;

    // Disk usage settings
    disk_interval?: number;
    disk_max_used_gb?: number;
    disk_max_used_pct?: number;
    disk_min_free_gb?: number;

    // Memory usage settings
    vm_max_used_pct?: number;
    ram_max_used_busy_pct?: number;
    ram_max_used_idle_pct?: number;

    // Network settings
    confirm_before_connecting?: boolean;
    hangup_if_dialed?: boolean;
    max_bytes_sec_up?: number;
    max_bytes_sec_down?: number;
    daily_xfer_limit_mb?: number;
    daily_xfer_period_days?: number;
    network_wifi_only?: boolean;

    // Other settings
    dont_verify_images?: boolean;
}
