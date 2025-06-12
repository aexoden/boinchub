import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../../services/project-service";
import { attachmentService } from "../../services/attachment-service";
import { ProjectCreate, ProjectUpdate } from "../../types";
import { queryKeys } from "./queryKeys";

export function useProjectsQuery(enabledOnly = false, offset = 0, limit = 100) {
    return useQuery({
        queryKey: queryKeys.projects.list({ enabledOnly, offset, limit }),
        queryFn: () => projectService.getAllProjects(enabledOnly),
    });
}

export function useProjectQuery(projectId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: queryKeys.projects.detail(projectId),
        queryFn: () => projectService.getProjectById(projectId),
        enabled: options?.enabled ?? !!projectId,
    });
}

export function useProjectAttachmentsQuery(projectId: string) {
    return useQuery({
        queryKey: queryKeys.projects.attachments(projectId),
        queryFn: () => attachmentService.getProjectAttachments(projectId),
    });
}

export function useCreateProjectMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (projectData: ProjectCreate) => projectService.createProject(projectData),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
        },
    });
}

export function useUpdateProjectMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, projectData }: { projectId: string; projectData: ProjectUpdate }) =>
            projectService.updateProject(projectId, projectData),
        onSuccess: async (updatedProject) => {
            queryClient.setQueryData(queryKeys.projects.detail(updatedProject.id), updatedProject);
            await queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
        },
    });
}

export function useDeleteProjectMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: projectService.deleteProject,
        onSuccess: async (_, deletedProjectId) => {
            queryClient.removeQueries({ queryKey: queryKeys.projects.detail(deletedProjectId) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
        },
    });
}
