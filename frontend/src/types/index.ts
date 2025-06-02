// User related types
export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
}

export interface UserCredentials {
    username: string;
    password: string;
}

export interface UserRegister extends UserCredentials {
    email: string;
}

export interface UserUpdate {
    email?: string;
    password?: string;
    role?: string;
    is_active?: boolean;
}

// Computer related types
export interface Computer {
    id: number;
    uuid: string;
    cpid: string;
    domain_name: string;
    user_id: number;
    created_at: string;
    updated_at: string;
}

// Project related types
export interface Project {
    id: number;
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

// Project Attachment related types
export interface ProjectAttachment {
    id: number;
    computer_id: number;
    project_id: number;
    resource_share: number;
    suspended: boolean;
    dont_request_more_work: boolean;
    detach_when_done: boolean;
    no_cpu: boolean;
    no_gpu_nvidia: boolean;
    no_gpu_amd: boolean;
    no_gpu_intel: boolean;
    authenticator: string;
}

export interface ProjectAttachmentCreate {
    computer_id: number;
    project_id: number;
    resource_share?: number;
    suspended?: boolean;
    dont_request_more_work?: boolean;
    detach_when_done?: boolean;
    no_cpu?: boolean;
    no_gpu_nvidia?: boolean;
    no_gpu_amd?: boolean;
    no_gpu_intel?: boolean;
    authenticator?: string;
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
    authenticator?: string;
}

// Authentication related types
export interface AuthResponse {
    access_token: string;
    token_type: string;
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
