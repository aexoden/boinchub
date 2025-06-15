import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ProjectAttachmentCreate } from "../../types";
import {
    useComputerQuery,
    useComputerAttachmentsQuery,
    useProjectsQuery,
    useCurrentUserProjectKeysQuery,
    useCreateAttachmentMutation,
    useDeleteAttachmentMutation,
} from "../../hooks/queries";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useConfig } from "../../contexts/ConfigContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate } from "../../util/date";

export default function ComputerDetailPage() {
    const { computerId } = useParams<{ computerId: string }>();
    const navigate = useNavigate();
    const { config } = useConfig();

    // Queries
    const { data: computer, isLoading: computerLoading, error: computerError } = useComputerQuery(computerId ?? "");
    const { data: attachments = [], isLoading: attachmentsLoading } = useComputerAttachmentsQuery(computerId ?? "");
    const { data: allProjects = [], isLoading: projectsLoading } = useProjectsQuery(true);
    const { data: userProjectKeys = [], isLoading: keysLoading } = useCurrentUserProjectKeysQuery();

    // Mutations
    const createAttachmentMutation = useCreateAttachmentMutation();
    const deleteAttachmentMutation = useDeleteAttachmentMutation();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [resourceShare, setResourceShare] = useState("100");

    // Error states
    const [pageError, setPageError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    // Create a map for quick project lookup
    const projectsMap = allProjects.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.name;
        return acc;
    }, {});

    // Set page title
    usePageTitle(computer?.hostname ?? "Loading...");

    // Create a set of project IDs the user has keys for
    const userProjectKeyIds = new Set(userProjectKeys.map((key) => key.project_id));

    // Get projects that are already attached to this computer
    const attachedProjectIds = attachments.map((a) => a.project_id);

    // Get projects available for attachment (enabled, user has key, not already attached)
    const availableProjects = allProjects.filter(
        (p) => p.enabled && userProjectKeyIds.has(p.id) && !attachedProjectIds.includes(p.id),
    );

    const handleAddAttachment = () => {
        setSelectedProject("");
        setResourceShare("100");
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleInputChange = (field: string, value: string) => {
        if (modalError) {
            setModalError(null);
        }

        switch (field) {
            case "project":
                setSelectedProject(value);
                break;
            case "resourceShare":
                setResourceShare(value);
                break;
        }
    };

    const handleCreateAttachment = async () => {
        setModalError(null);

        if (!selectedProject) {
            setModalError("Please select a project to attach.");
            return;
        }

        if (!computer) {
            setModalError("Computer not found.");
            return;
        }

        const resourceShareNum = Number(resourceShare);
        if (isNaN(resourceShareNum) || resourceShareNum < 0) {
            setModalError("Resource share must be a valid number greater than or equal to 0.");
            return;
        }

        try {
            const attachmentData: ProjectAttachmentCreate = {
                computer_id: computer.id,
                project_id: selectedProject,
                resource_share: resourceShareNum,
            };

            await createAttachmentMutation.mutateAsync(attachmentData);
            setIsModalOpen(false);
            setPageError(null);
        } catch (err: unknown) {
            let errorMessage = "Failed to create attachment";

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

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!window.confirm("Are you sure you want to detach this project?")) {
            return;
        }

        try {
            await deleteAttachmentMutation.mutateAsync(attachmentId);
            setPageError(null);
        } catch (err: unknown) {
            let errorMessage = "Failed to detach project";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = String(err.detail);
            }

            setPageError(errorMessage);
        }
    };

    // Loading state
    const isLoading = computerLoading || attachmentsLoading || projectsLoading || keysLoading;
    const isSubmitting = createAttachmentMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (computerError) {
        return (
            <div className="border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{computerError.message}</p>
                        <button
                            onClick={() => void navigate("/computers")}
                            className="mt-2 cursor-pointer text-sm font-medium text-red-700 hover:text-red-600"
                        >
                            Go back to computers list
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!computer) {
        return (
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">Computer not found</p>
                        <button
                            onClick={() => void navigate("/computers")}
                            className="mt-2 cursor-pointer text-sm font-medium text-yellow-700 hover:text-yellow-600"
                        >
                            Go back to computers list
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{computer.hostname}</h1>
                    <p className="mt-1 text-gray-600">Computer details and attached projects</p>
                </div>
                <button
                    onClick={() => void navigate("/computers")}
                    className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                >
                    Back to Computers
                </button>
            </div>

            {/* Error Message */}
            {pageError && (
                <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{pageError}</p>
                            <button
                                onClick={() => {
                                    setPageError(null);
                                }}
                                className="mt-2 cursor-pointer text-sm font-medium text-red-700 hover:text-red-600"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Computer Details */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Computer Information</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Hostname</h3>
                        <p className="mt-1 text-gray-900">{computer.hostname}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">BOINC CPID</h3>
                        <p className="mt-1 font-mono text-gray-900">{computer.cpid}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">First Seen</h3>
                        <p className="mt-1 text-gray-900">{formatDate(computer.created_at)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Connection</h3>
                        <p className="mt-1 text-gray-900">{formatDate(computer.updated_at)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">
                            {config?.account_manager_name ?? "BoincHub"} ID
                        </h3>
                        <p className="mt-1 font-mono text-gray-900">{computer.id}</p>
                    </div>
                </div>
            </div>

            {/* Attached Projects */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Attached Projects</h2>
                    <button
                        onClick={handleAddAttachment}
                        disabled={availableProjects.length === 0 || isSubmitting}
                        className={`rounded-md px-4 py-2 text-white transition-colors ${
                            availableProjects.length > 0 && !isSubmitting
                                ? "cursor-pointer bg-primary-600 hover:bg-primary-700"
                                : "cursor-not-allowed bg-gray-400"
                        }`}
                        title={
                            availableProjects.length === 0
                                ? "No available projects to attach. Set up project account keys in your settings first."
                                : ""
                        }
                    >
                        Attach Project
                    </button>
                </div>

                {/* Show message if no project keys are set up */}
                {userProjectKeys.length === 0 && (
                    <div className="mb-4 border-l-4 border-yellow-500 bg-yellow-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    You need to set up project account keys before you can attach projects to your
                                    computers.
                                </p>
                                <Link
                                    to="/settings"
                                    className="mt-2 cursor-pointer text-sm font-medium text-yellow-700 hover:text-yellow-600"
                                >
                                    Go to Settings to add project keys
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {attachments.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        <p>No projects are attached to this computer.</p>
                        {availableProjects.length > 0 ? (
                            <p className="mt-2">Click the "Attach Project" button to add a project.</p>
                        ) : userProjectKeys.length > 0 ? (
                            <p className="mt-2">All available projects are already attached to this computer.</p>
                        ) : (
                            <p className="mt-2">Set up project account keys in Settings to attach projects.</p>
                        )}
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
                                        Resource Share
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
                                {attachments.map((attachment) => {
                                    const projectName = projectsMap[attachment.project_id] || "Unknown Project";

                                    return (
                                        <tr key={attachment.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{projectName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{attachment.resource_share}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {attachment.suspended ? (
                                                    <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs leading-5 font-semibold text-yellow-800">
                                                        Suspended
                                                    </span>
                                                ) : attachment.dont_request_more_work ? (
                                                    <span className="inline-flex rounded-full bg-orange-100 px-2 text-xs leading-5 font-semibold text-orange-800">
                                                        No New Work
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <Link
                                                    to={`/attachments/${attachment.id}`}
                                                    className="mr-4 cursor-pointer text-primary-600 hover:text-primary-900"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        void handleDeleteAttachment(attachment.id);
                                                    }}
                                                    className="cursor-pointer text-red-600 transition-colors hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                                                    disabled={deleteAttachmentMutation.isPending}
                                                >
                                                    {deleteAttachmentMutation.isPending ? "Detaching..." : "Detach"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Project Modal */}
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
                            Attach New Project
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
                                void handleCreateAttachment();
                            }}
                            className="mt-4"
                        >
                            <div className="mb-4">
                                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                                    Project
                                </label>
                                <select
                                    id="project"
                                    value={selectedProject}
                                    onChange={(e) => {
                                        handleInputChange("project", e.target.value);
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
                                <p className="mt-1 text-sm text-gray-500">
                                    Only projects for which you have account keys are shown.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="resourceShare" className="block text-sm font-medium text-gray-700">
                                    Resource Share
                                </label>
                                <input
                                    type="number"
                                    id="resourceShare"
                                    min="0"
                                    value={resourceShare}
                                    onChange={(e) => {
                                        handleInputChange("resourceShare", e.target.value);
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Determines how much computing resource this project gets relative to others
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
                                    {isSubmitting ? "Attaching..." : "Attach Project"}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
