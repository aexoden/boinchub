import { InviteCode, InviteCodeCreate, InviteCodeUpdate } from "../types";

import apiClient from "./api-client";

export const inviteCodeService = {
    // Get all invite codes (admin only)
    getAllInviteCodes: async (activeOnly = false): Promise<InviteCode[]> => {
        const response = await apiClient.get<InviteCode[]>("/api/v1/invite_codes", {
            params: { active_only: activeOnly },
        });
        return response.data;
    },

    // Get an invite code by ID (admin only)
    getInviteCodeById: async (inviteCodeId: string): Promise<InviteCode> => {
        const response = await apiClient.get<InviteCode>(`/api/v1/invite_codes/${inviteCodeId}`);
        return response.data;
    },

    // Create a new invite code (admin only)
    createInviteCode: async (inviteCodeData: InviteCodeCreate): Promise<InviteCode> => {
        const response = await apiClient.post<InviteCode>("/api/v1/invite_codes", inviteCodeData);
        return response.data;
    },

    // Update an invite code (admin only)
    updateInviteCode: async (inviteCodeId: string, inviteCodeData: InviteCodeUpdate): Promise<InviteCode> => {
        const response = await apiClient.patch<InviteCode>(`/api/v1/invite_codes/${inviteCodeId}`, inviteCodeData);
        return response.data;
    },

    // Delete an invite code (admin only)
    deleteInviteCode: async (inviteCodeId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/invite_codes/${inviteCodeId}`);
    },
};

export default inviteCodeService;
