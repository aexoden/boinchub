import apiClient from "./api-client";
import { Project, ProjectCreate, ProjectUpdate } from "../types";

export const projectService = {
    // Get all projects
    getAllProjects: async (enabledOnly = false): Promise<Project[]> => {
        const response = await apiClient.get<Project[]>("/api/v1/projects", {
            params: { enabled_only: enabledOnly },
        });
        return response.data;
    },

    // Get a project by ID
    getProjectById: async (projectId: number): Promise<Project> => {
        const response = await apiClient.get<Project>(`/api/v1/projects/${projectId.toString()}`);
        return response.data;
    },

    // Admin: Create a project
    createProject: async (projectData: ProjectCreate): Promise<Project> => {
        const response = await apiClient.post<Project>("/api/v1/projects", projectData);
        return response.data;
    },

    // Admin: Update a project
    updateProject: async (projectId: number, projectData: ProjectUpdate): Promise<Project> => {
        const response = await apiClient.put<Project>(`/api/v1/projects/${projectId.toString()}`, projectData);
        return response.data;
    },

    // Admin: Delete a project
    deleteProject: async (projectId: number): Promise<void> => {
        await apiClient.delete(`/api/v1/projects/${projectId.toString()}`);
    },
};

export default projectService;
