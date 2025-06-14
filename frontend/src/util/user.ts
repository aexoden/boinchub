import { User } from "../types";

export function isAdmin(user: User): boolean {
    return user.role === "admin" || user.role === "super_admin";
}

export function isSuperAdmin(user: User): boolean {
    return user.role === "super_admin";
}

export function canManageUsers(user: User): boolean {
    return isAdmin(user);
}

export function canChangeRoles(user: User): boolean {
    return isSuperAdmin(user);
}

export function getRoleDisplayName(role: string): string {
    switch (role) {
        case "super_admin":
            return "Super Admin";
        case "admin":
            return "Admin";
        case "user":
            return "User";
        default:
            return role;
    }
}

export function getRoleColor(role: string): string {
    switch (role) {
        case "super_admin":
            return "bg-red-100 text-red-800";
        case "admin":
            return "bg-purple-100 text-purple-800";
        case "user":
            return "bg-blue-100 text-blue-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}
