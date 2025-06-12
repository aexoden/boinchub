import { useQuery } from "@tanstack/react-query";
import { computerService } from "../../services/computer-service";
import { attachmentService } from "../../services/attachment-service";
import { queryKeys } from "./queryKeys";

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
