import apiClient from "./api-client";
import { UserProjectKey, UserProjectKeyWithProject, UserProjectKeyRequest } from "../types";

export const userProjectKeyService = {
    // Get current user's project keys
    getCurrentUserProjectKeys: async (): Promise<UserProjectKeyWithProject[]> => {
        const response = await apiClient.get<UserProjectKeyWithProject[]>("/api/v1/user_project_keys/me");
        return response.data;
    },

    // Create or update current user's project key
    createOrUpdateProjectKey: async (keyData: UserProjectKeyRequest): Promise<UserProjectKey> => {
        const response = await apiClient.post<UserProjectKey>("/api/v1/user_project_keys/me", keyData);
        return response.data;
    },

    // Delete current user's project key
    deleteProjectKey: async (projectId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/user_project_keys/me/${projectId}`);
    },

    // Admin: Get all user project keys
    getAllUserProjectKeys: async (): Promise<UserProjectKey[]> => {
        const response = await apiClient.get<UserProjectKey[]>("/api/v1/user_project_keys");
        return response.data;
    },
};
