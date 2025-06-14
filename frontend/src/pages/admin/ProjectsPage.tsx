import React, { useState } from "react";
import { Project, ProjectCreate, ProjectUpdate } from "../../types";
import {
    useProjectsQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,
} from "../../hooks/queries";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function ProjectsPage() {
    const { data: projects = [], isLoading: loading, error } = useProjectsQuery();

    const createProjectMutation = useCreateProjectMutation();
    const updateProjectMutation = useUpdateProjectMutation();
    const deleteProjectMutation = useDeleteProjectMutation();

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<ProjectCreate | ProjectUpdate>({
        name: "",
        url: "",
        signed_url: "",
        description: "",
        admin_notes: "",
        enabled: true,
    });

    // Modal error state
    const [modalError, setModalError] = useState<string | null>(null);

    // Open modal for creating a new project
    const handleAddProject = () => {
        setEditingProject(null);
        setFormData({
            name: "",
            url: "",
            signed_url: "",
            description: "",
            admin_notes: "",
            enabled: true,
        } as ProjectCreate);

        setModalError(null);
        setIsModalOpen(true);
    };

    // Open modal for editing an existing project
    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            url: project.url,
            signed_url: project.signed_url,
            description: project.description,
            admin_notes: project.admin_notes,
            enabled: project.enabled,
        } as ProjectUpdate);

        setModalError(null);
        setIsModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Clear errors when user starts typing
        if (modalError) {
            setModalError(null);
        }

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        });
    };

    // Handle form submission
    const handleSubmit = async () => {
        setModalError(null);

        try {
            if (editingProject) {
                await updateProjectMutation.mutateAsync({
                    projectId: editingProject.id,
                    projectData: formData,
                });
            } else {
                await createProjectMutation.mutateAsync(formData as ProjectCreate);
            }

            setIsModalOpen(false);
        } catch (err: unknown) {
            let errorMessage = "An unexpected error occurred";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = (err as { detail: string }).detail || "An unexpected error occurred";
            }

            setModalError(errorMessage);
        }
    };

    // Handle project deletion
    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm("Are you sure you want to delete this project?")) {
            return;
        }

        try {
            await deleteProjectMutation.mutateAsync(projectId);
        } catch (err: unknown) {
            console.error("Failed to delete project:", err);
        }
    };

    const isSubmitting = createProjectMutation.isPending || updateProjectMutation.isPending;

    if (error) {
        return (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="mt-1 text-gray-600">Manage BOINC projects that users can attach to</p>
                </div>
                <button
                    onClick={handleAddProject}
                    className="cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
                >
                    Add Project
                </button>
            </div>

            {loading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-700">Loading projects...</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                    <p className="mb-4 text-gray-700">No projects have been added yet.</p>
                    <p className="text-gray-600">Click the "Add Project" button to add your first project.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    URL
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-mediumt ext-gray-900">{project.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-mono text-sm">
                                            <a
                                                href={project.url}
                                                className="cursor-pointer text-primary-600 hover:text-primary-800 hover:underline"
                                            >
                                                {project.url}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {project.enabled ? (
                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                                Enabled
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-red-100 px-2 text-xs leading-5 font-semibold text-red-800">
                                                Disabled
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                handleEditProject(project);
                                            }}
                                            className="mr-4 cursor-pointer text-primary-600 transition-colors hover:text-primary-900"
                                            disabled={isSubmitting}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                void handleDeleteProject(project.id);
                                            }}
                                            className="cursor-pointer text-red-600 transition-colors hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={deleteProjectMutation.isPending}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Project Form Modal */}
            <Dialog
                open={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                transition
                className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-closed:opacity-0"
            >
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900">
                            {editingProject ? "Edit Project" : "Add New Project"}
                        </DialogTitle>

                        {/* Error Display */}
                        {modalError && (
                            <div className="mt-4 border-l-4 border-red-500 bg-red-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{modalError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleSubmit();
                            }}
                            className="mt-4"
                        >
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                                    Project URL
                                </label>
                                <input
                                    type="url"
                                    name="url"
                                    id="url"
                                    value={formData.url}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="signed_url" className="block text-sm font-medium text-gray-700">
                                    Signed URL
                                </label>
                                <textarea
                                    name="signed_url"
                                    id="signed_url"
                                    value={formData.signed_url}
                                    onChange={handleInputChange}
                                    rows={3}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Generated offline using BOINC cryptographic tools
                                </p>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    id="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700">
                                    Admin Notes
                                </label>
                                <textarea
                                    name="admin_notes"
                                    id="admin_notes"
                                    value={formData.admin_notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    name="enabled"
                                    id="enabled"
                                    checked={formData.enabled}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label
                                    htmlFor="enabled"
                                    className="ml-2 block cursor-pointer text-sm font-medium text-gray-700"
                                >
                                    Enabled
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                    }}
                                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="cursor-pointer rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting
                                        ? editingProject
                                            ? "Updating..."
                                            : "Adding..."
                                        : editingProject
                                          ? "Update Project"
                                          : "Add Project"}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
