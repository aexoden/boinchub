import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attachmentService } from "../../services/attachment-service";
import { ProjectAttachment, ProjectAttachmentCreate, ProjectAttachmentUpdate } from "../../types";
import { queryKeys } from "./queryKeys";

export function useAttachmentQuery(attachmentId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: queryKeys.attachments.detail(attachmentId),
        queryFn: () => attachmentService.getAttachmentById(attachmentId),
        enabled: options?.enabled ?? !!attachmentId,
    });
}

export function useCreateAttachmentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (attachmentData: ProjectAttachmentCreate) => attachmentService.createAttachment(attachmentData),
        onSuccess: async (newAttachment) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.computers.attachments(newAttachment.computer_id),
            });
            await queryClient.invalidateQueries({
                queryKey: queryKeys.projects.attachments(newAttachment.project_id),
            });
        },
    });
}

export function useUpdateAttachmentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            attachmentId,
            attachmentData,
        }: {
            attachmentId: string;
            attachmentData: ProjectAttachmentUpdate;
        }) => attachmentService.updateAttachment(attachmentId, attachmentData),
        onSuccess: async (updatedAttachment) => {
            queryClient.setQueryData(queryKeys.attachments.detail(updatedAttachment.id), updatedAttachment);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.computers.attachments(updatedAttachment.computer_id),
            });
            await queryClient.invalidateQueries({
                queryKey: queryKeys.projects.attachments(updatedAttachment.project_id),
            });
        },
    });
}

export function useDeleteAttachmentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: attachmentService.deleteAttachment,
        onMutate: async (attachmentId: string) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.attachments.detail(attachmentId) });

            // Get the attachment data before deletion for optimistic update
            const previousAttachment = queryClient.getQueryData(queryKeys.attachments.detail(attachmentId));

            return { previousAttachment };
        },
        onSuccess: async (_, attachmentId, context) => {
            // Remove the attachment from cache
            queryClient.removeQueries({ queryKey: queryKeys.attachments.detail(attachmentId) });

            // Invalidate related queries if we have the previous attachment data
            if (context.previousAttachment) {
                const attachment = context.previousAttachment as ProjectAttachment;
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.computers.attachments(attachment.computer_id),
                });
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.projects.attachments(attachment.project_id),
                });
            }
        },
    });
}
