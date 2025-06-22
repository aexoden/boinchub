import { PreferenceGroup, PreferenceGroupCreate, PreferenceGroupUpdate } from "../types";

import apiClient from "./api-client";

export const preferenceGroupService = {
    // Get all preference groups
    getAllPreferenceGroups: async (scope = "available"): Promise<PreferenceGroup[]> => {
        const response = await apiClient.get<PreferenceGroup[]>("/api/v1/preference_groups", {
            params: { scope },
        });
        return response.data;
    },

    // Get a preference group by ID
    getPreferenceGroupById: async (preferenceGroupId: string): Promise<PreferenceGroup> => {
        const response = await apiClient.get<PreferenceGroup>(`/api/v1/preference_groups/${preferenceGroupId}`);
        return response.data;
    },

    // Create a new preference group
    createPreferenceGroup: async (preferenceGroupData: PreferenceGroupCreate): Promise<PreferenceGroup> => {
        const response = await apiClient.post<PreferenceGroup>("/api/v1/preference_groups", preferenceGroupData);
        return response.data;
    },

    // Update an existing preference group
    updatePreferenceGroup: async (
        preferenceGroupId: string,
        preferenceGroupData: PreferenceGroupUpdate,
    ): Promise<PreferenceGroup> => {
        const response = await apiClient.patch<PreferenceGroup>(
            `/api/v1/preference_groups/${preferenceGroupId}`,
            preferenceGroupData,
        );
        return response.data;
    },

    // Delete a preference group
    deletePreferenceGroup: async (preferenceGroupId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/preference_groups/${preferenceGroupId}`);
    },
};
