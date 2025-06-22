import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inviteCodeService } from "../../services/invite-code-service";
import { InviteCodeCreate, InviteCodeUpdate } from "../../types";

import { queryKeys } from "./queryKeys";

export function useInviteCodesQuery(activeOnly = false, offset = 0, limit = 100) {
    return useQuery({
        queryKey: queryKeys.inviteCodes.list({ activeOnly, offset, limit }),
        queryFn: () => inviteCodeService.getAllInviteCodes(activeOnly),
    });
}

export function useInviteCodeQuery(inviteCodeId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: queryKeys.inviteCodes.detail(inviteCodeId),
        queryFn: () => inviteCodeService.getInviteCodeById(inviteCodeId),
        enabled: options?.enabled ?? !!inviteCodeId,
    });
}

export function useCreateInviteCodeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (inviteCodeData: InviteCodeCreate) => inviteCodeService.createInviteCode(inviteCodeData),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes.lists() });
        },
    });
}

export function useUpdateInviteCodeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ inviteCodeId, inviteCodeData }: { inviteCodeId: string; inviteCodeData: InviteCodeUpdate }) =>
            inviteCodeService.updateInviteCode(inviteCodeId, inviteCodeData),
        onSuccess: async (updatedCode) => {
            queryClient.setQueryData(["inviteCodes", "detail", updatedCode.id], updatedCode);
            await queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes.lists() });
        },
    });
}

export function useDeleteInviteCodeMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: inviteCodeService.deleteInviteCode,
        onSuccess: async (_, deletedInviteCodeId) => {
            queryClient.removeQueries({ queryKey: ["inviteCodes", "detail", deletedInviteCodeId] });
            await queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes.lists() });
        },
    });
}
