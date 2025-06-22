import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { preferenceGroupService } from "../../services/preference-group-service";
import { PreferenceGroupCreate, PreferenceGroupUpdate } from "../../types";

import { queryKeys } from "./queryKeys";

export function usePreferenceGroupsQuery(scope = "available", offset = 0, limit = 100) {
    return useQuery({
        queryKey: queryKeys.preferenceGroups.list({ scope, offset, limit }),
        queryFn: () => preferenceGroupService.getAllPreferenceGroups(scope),
    });
}

export function usePreferenceGroupQuery(preferenceGroupId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: queryKeys.preferenceGroups.detail(preferenceGroupId),
        queryFn: () => preferenceGroupService.getPreferenceGroupById(preferenceGroupId),
        enabled: options?.enabled ?? !!preferenceGroupId,
    });
}

export function useCreatePreferenceGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (preferenceGroupData: PreferenceGroupCreate) =>
            preferenceGroupService.createPreferenceGroup(preferenceGroupData),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.preferenceGroups.lists() });
        },
    });
}

export function useUpdatePreferenceGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            preferenceGroupId,
            preferenceGroupData,
        }: {
            preferenceGroupId: string;
            preferenceGroupData: PreferenceGroupUpdate;
        }) => preferenceGroupService.updatePreferenceGroup(preferenceGroupId, preferenceGroupData),
        onSuccess: async (updatedGroup) => {
            queryClient.setQueryData(queryKeys.preferenceGroups.detail(updatedGroup.id), updatedGroup);
            await queryClient.invalidateQueries({ queryKey: queryKeys.preferenceGroups.lists() });
        },
    });
}

export function useDeletePreferenceGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: preferenceGroupService.deletePreferenceGroup,
        onSuccess: async (_, deletedPreferenceGroupId) => {
            queryClient.removeQueries({ queryKey: queryKeys.preferenceGroups.detail(deletedPreferenceGroupId) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.preferenceGroups.lists() });
        },
    });
}
