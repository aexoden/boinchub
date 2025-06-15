import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { computerService } from "../../services/computer-service";
import { attachmentService } from "../../services/attachment-service";
import { queryKeys } from "./queryKeys";
import { ComputerUpdate } from "../../types";

export function useComputerQuery(computerId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: queryKeys.computers.detail(computerId),
        queryFn: () => computerService.getComputerById(computerId),
        enabled: options?.enabled ?? !!computerId,
    });
}

export function useComputerAttachmentsQuery(computerId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: queryKeys.computers.attachments(computerId),
        queryFn: () => attachmentService.getComputerAttachments(computerId),
        enabled: options?.enabled ?? !!computerId,
    });
}

export function useUpdateComputerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ computerId, computerData }: { computerId: string; computerData: ComputerUpdate }) =>
            computerService.updateComputer(computerId, computerData),
        onSuccess: async (updatedComputer) => {
            queryClient.setQueryData(queryKeys.computers.detail(updatedComputer.id), updatedComputer);
            await queryClient.invalidateQueries({ queryKey: queryKeys.computers.lists() });
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.currentUserComputers() });
        },
    });
}
