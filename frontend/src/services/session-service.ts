import apiClient from "./api-client";
import { UserSession } from "../types";

export const sessionService = {
    // Get all sessions for the current user
    getUserSessions: async (): Promise<UserSession[]> => {
        const response = await apiClient.get<UserSession[]>("/api/v1/auth/sessions");
        return response.data;
    },

    // Revoke a specific session
    revokeSession: async (sessionId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/auth/sessions/${sessionId}`);
    },

    // Logout all other sessions except the current one
    logoutAllOtherSessions: async (): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>("/api/v1/auth/logout-all");
        return response.data;
    },
};

export default sessionService;
