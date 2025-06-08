import apiClient from "./api-client";
import { ProjectAttachment, ProjectAttachmentCreate, ProjectAttachmentUpdate } from "../types";

export const attachmentService = {
    // Create an attachment
    createAttachment: async (attachmentData: ProjectAttachmentCreate): Promise<ProjectAttachment> => {
        const response = await apiClient.post<ProjectAttachment>("/api/v1/project_attachments", attachmentData);
        return response.data;
    },

    // Get attachments for a computer
    getComputerAttachments: async (computerId: string): Promise<ProjectAttachment[]> => {
        const response = await apiClient.get<ProjectAttachment[]>(
            `/api/v1/computers/${computerId}/project_attachments`,
        );
        return response.data;
    },

    // Admin: Get attachments for a project
    getProjectAttachments: async (projectId: string): Promise<ProjectAttachment[]> => {
        const response = await apiClient.get<ProjectAttachment[]>(`/api/v1/projects/${projectId}/project_attachments`);
        return response.data;
    },

    // Get an attachment by ID
    getAttachmentById: async (attachmentId: string): Promise<ProjectAttachment> => {
        const response = await apiClient.get<ProjectAttachment>(`/api/v1/project_attachments/${attachmentId}`);
        return response.data;
    },

    // Update an attachment
    updateAttachment: async (
        attachmentId: string,
        attachmentData: ProjectAttachmentUpdate,
    ): Promise<ProjectAttachment> => {
        const response = await apiClient.patch<ProjectAttachment>(
            `/api/v1/project_attachments/${attachmentId}`,
            attachmentData,
        );
        return response.data;
    },

    // Delete an attachment
    deleteAttachment: async (attachmentId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/project_attachments/${attachmentId}`);
    },
};

export default attachmentService;
