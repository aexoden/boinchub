import apiClient from "./api-client";
import { ProjectAttachment, ProjectAttachmentCreate, ProjectAttachmentUpdate } from "../types";

export const attachmentService = {
    // Create an attachment
    createAttachment: async (attachmentData: ProjectAttachmentCreate): Promise<ProjectAttachment> => {
        const response = await apiClient.post<ProjectAttachment>("/api/v1/attachments", attachmentData);
        return response.data;
    },

    // Get attachments for a computer
    getComputerAttachments: async (computerId: number): Promise<ProjectAttachment[]> => {
        const response = await apiClient.get<ProjectAttachment[]>(
            `/api/v1/attachments/computer/${computerId.toString()}`,
        );
        return response.data;
    },

    // Admin: Get attachments for a project
    getProjectAttachments: async (projectId: number): Promise<ProjectAttachment[]> => {
        const response = await apiClient.get<ProjectAttachment[]>(
            `/api/v1/attachments/project/${projectId.toString()}`,
        );
        return response.data;
    },

    // Get an attachment by ID
    getAttachmentById: async (attachmentId: number): Promise<ProjectAttachment> => {
        const response = await apiClient.get<ProjectAttachment>(`/api/v1/attachments/${attachmentId.toString()}`);
        return response.data;
    },

    // Update an attachment
    updateAttachment: async (
        attachmentId: number,
        attachmentData: ProjectAttachmentUpdate,
    ): Promise<ProjectAttachment> => {
        const response = await apiClient.put<ProjectAttachment>(
            `/api/v1/attachments/${attachmentId.toString()}`,
            attachmentData,
        );
        return response.data;
    },

    // Delete an attachment
    deleteAttachment: async (attachmentId: number): Promise<void> => {
        await apiClient.delete(`/api/v1/attachments/${attachmentId.toString()}`);
    },
};

export default attachmentService;
