import apiClient from "./api-client";
import { User, UserRegister, UserUpdate } from "../types";

export const userService = {
    // Get current user info
    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get<User>("/api/v1/users/me");
        return response.data;
    },

    // Update current user info
    updateCurrentUser: async (userData: UserUpdate): Promise<User> => {
        const response = await apiClient.patch<User>("/api/v1/users/me", userData);
        return response.data;
    },

    // Register a new user
    register: async (userData: UserRegister): Promise<User> => {
        const response = await apiClient.post<User>("/api/v1/users/register", userData);
        return response.data;
    },

    // Admin: Get all users
    getAllUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>("/api/v1/users");
        return response.data;
    },

    // Admin: Get user by ID
    getUserById: async (userId: number): Promise<User> => {
        const response = await apiClient.get<User>(`/api/v1/users/${userId.toString()}`);
        return response.data;
    },

    // Admin: Update a user
    updateUser: async (userId: number, userData: UserUpdate): Promise<User> => {
        const response = await apiClient.patch<User>(`/api/v1/users/${userId.toString()}`, userData);
        return response.data;
    },

    // Admin: Delete a user
    deleteUser: async (userId: number): Promise<void> => {
        await apiClient.delete(`/api/v1/users/${userId.toString()}`);
    },
};

export default userService;
