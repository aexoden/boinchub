import { useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
    useCurrentUserProjectKeysQuery,
    useProjectsQuery,
    useCreateOrUpdateProjectKeyMutation,
    useDeleteProjectKeyMutation,
} from "../../hooks/queries";
import { UserProjectKeyRequest } from "../../types";

export default function ProjectKeysManagement() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState("");
    const [accountKey, setAccountKey] = useState("");
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    // Queries
    const { data: userProjectKeys = [], isLoading: keysLoading, error: keysError } = useCurrentUserProjectKeysQuery();
    const { data: allProjects = [], isLoading: projectsLoading } = useProjectsQuery(true);

    // Mutations
    const createOrUpdateMutation = useCreateOrUpdateProjectKeyMutation();
    const deleteMutation = useDeleteProjectKeyMutation();

    // Sort user project keys by project name
    const sortedUserProjectKeys = useMemo(() => {
        return [...userProjectKeys].sort((a, b) => a.project_name.localeCompare(b.project_name));
    }, [userProjectKeys]);

    // Get available projects (enabled projects the user doesn't have keys for)
    const userProjectIds = new Set(userProjectKeys.map((key) => key.project_id));
    const availableProjects = allProjects.filter((project) => !userProjectIds.has(project.id));

    const handleAddKey = () => {
        setEditingKey(null);
        setSelectedProject("");
        setAccountKey("");
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleEditKey = (key: (typeof userProjectKeys)[0]) => {
        setEditingKey(key.project_id);
        setSelectedProject(key.project_id);
        setAccountKey(key.account_key);
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        setModalError(null);

        if (!selectedProject) {
            setModalError("Please select a project");
            return;
        }

        if (!accountKey.trim()) {
            setModalError("Please enter an account key");
            return;
        }

        try {
            const keyData: UserProjectKeyRequest = {
                project_id: selectedProject,
                account_key: accountKey.trim(),
            };

            await createOrUpdateMutation.mutateAsync(keyData);
            setIsModalOpen(false);
        } catch (err: unknown) {
            let errorMessage = "Failed to save account key";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = String(err.detail);
            }

            setModalError(errorMessage);
        }
    };

    const handleDeleteKey = async (projectId: string) => {
        if (!window.confirm("Are you sure you want to delete this project key? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(projectId);
        } catch (err: unknown) {
            console.error("Failed to delete project key:", err);
        }
    };

    const isLoading = keysLoading || projectsLoading;
    const isSubmitting = createOrUpdateMutation.isPending;

    if (keysError) {
        return (
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Project Account Keys</h2>
                <div className="border-l-4 border-red-500 bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{keysError.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">Project Account Keys</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage your account keys for BOINC projects. These keys are shared across all your computers.
                    </p>
                </div>
                <button
                    onClick={handleAddKey}
                    disabled={availableProjects.length === 0 || isSubmitting}
                    className={`rounded-md px-4 py-2 text-white transition-colors ${
                        availableProjects.length > 0 && !isSubmitting
                            ? "cursor-pointer bg-primary-600 hover:bg-primary-700"
                            : "cursor-not-allowed bg-gray-400"
                    }`}
                    title={availableProjects.length === 0 ? "No available projects to add keys for" : ""}
                >
                    Add Project Key
                </button>
            </div>

            {isLoading ? (
                <div className="py-4 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading project keys...</span>
                </div>
            ) : sortedUserProjectKeys.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                    <p>You haven't set up any project account keys yet.</p>
                    <p className="mt-2">Add a project key to start attaching projects to your computers.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Project
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Account Key
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {sortedUserProjectKeys.map((key) => (
                                <tr key={key.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{key.project_name}</div>
                                            <div className="text-sm text-gray-500">
                                                <a
                                                    href={key.project_url}
                                                    className="cursor-pointer text-primary-600 hover:text-primary-800 hover:underline"
                                                >
                                                    {key.project_url}
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-mono text-sm text-gray-900">
                                            {key.account_key.substring(0, 16)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                handleEditKey(key);
                                            }}
                                            className="mr-4 cursor-pointer text-primary-600 transition-colors hover:text-primary-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                void handleDeleteKey(key.project_id);
                                            }}
                                            className="cursor-pointer text-red-600 transition-colors hover:text-red-900 disabled:cursor-not-allowed"
                                            disabled={deleteMutation.isPending}
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

            {/* Add/Edit Project Key Modal */}
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
                            {editingKey ? "Edit Project Key" : "Add Project Key"}
                        </DialogTitle>

                        {/* Modal Error Display */}
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
                                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                                    Project
                                </label>
                                {editingKey ? (
                                    <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 p-2">
                                        {userProjectKeys.find((k) => k.project_id === editingKey)?.project_name}
                                    </div>
                                ) : (
                                    <select
                                        id="project"
                                        value={selectedProject}
                                        onChange={(e) => {
                                            setSelectedProject(e.target.value);
                                            if (modalError) setModalError(null);
                                        }}
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="" disabled>
                                            Select a project
                                        </option>
                                        {availableProjects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="accountKey" className="block text-sm font-medium text-gray-700">
                                    Account Key
                                </label>
                                <input
                                    type="text"
                                    id="accountKey"
                                    value={accountKey}
                                    onChange={(e) => {
                                        setAccountKey(e.target.value);
                                        if (modalError) setModalError(null);
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                    placeholder="Enter your project account key"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    You can obtain this from the project website. You should be able to use either your
                                    account key or your weak account key. Note that your weak account key will change if
                                    you change your project password.
                                </p>
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
                                    {isSubmitting ? "Saving..." : editingKey ? "Update Key" : "Add Key"}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
